"""
routes/admin.py
---------------
Admin-only endpoints — protected by require_admin decorator.
All routes check X-Admin-Token header.
"""
from flask import Blueprint, jsonify, request, current_app
from marshmallow import ValidationError as MarshmallowValidationError

from core.extensions import cache, limiter
from core.config import settings
from core.auth_guard import require_admin
from core.exceptions import AppError, SyncAlreadyRunningError
from models.audit import ScrapeLog
from repositories.job_repository import job_repo
from repositories.hr_repository import hr_repo
from repositories.research_repository import research_repo
from repositories.prep_repository import prep_repo
from repositories.user_repository import user_repo
from models.job import Job
from services.sync_service import sync_service
from scheduler import get_scheduler_status
from schemas.job_schemas import admin_sync_schema

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/stats', methods=['GET'])
@limiter.limit(settings.RATE_LIMIT_ADMIN)
@require_admin
@cache.cached(timeout=settings.CACHE_TTL_ADMIN_STATS, key_prefix='admin_stats')
def get_stats():
    """
    GET /api/admin/stats
    Admin-only. Cached 30s. Requires X-Admin-Token header.
    """
    _, total_jobs, _ = job_repo.search(limit=1)
    _, india_jobs, _ = job_repo.search(region='India', limit=1)
    _, global_jobs, _ = job_repo.search(region='Global / US', limit=1)
    _, new_today, _ = job_repo.search(new_today=True, limit=1)
    early_access = job_repo.get_early_access_count()
    total_hr = hr_repo.get_total_count()
    total_professors = research_repo.get_total_count()
    total_prep = prep_repo.get_total_count()
    total_users = user_repo.get_total_count()
    premium_users = user_repo.get_premium_count()
    latest_log = ScrapeLog.query.order_by(ScrapeLog.id.desc()).first()

    # Source breakdown counts
    source_counts = {
        'linkedin': Job.query.filter(
            (Job.source.ilike('%linkedin%') | Job.apply_url.ilike('%linkedin%') | Job.source_url.ilike('%linkedin%')),
            Job.is_deleted == False
        ).count(),
        'internshala': Job.query.filter(
            (Job.source.ilike('%internshala%') | Job.apply_url.ilike('%internshala%') | Job.source_url.ilike('%internshala%')),
            Job.is_deleted == False
        ).count(),
        'wellfound': Job.query.filter(
            (Job.source.ilike('%wellfound%') | Job.apply_url.ilike('%wellfound%') | Job.source_url.ilike('%wellfound%') | Job.apply_url.ilike('%angel.co%')),
            Job.is_deleted == False
        ).count(),
        'carrerlift': Job.query.filter(
            (Job.source.ilike('%carrerlift%') | Job.source.ilike('%joborbit%')),
            Job.is_deleted == False
        ).count(),
    }

    return jsonify({
        'status': 'success',
        'stats': {
            'total_jobs': total_jobs,
            'india_jobs': india_jobs,
            'global_jobs': global_jobs,
            'new_today': new_today,
            'early_access': early_access,
            'total_hr': total_hr,
            'total_professors': total_professors,
            'total_prep_questions': total_prep,
            'total_users': max(1, total_users),
            'premium_users': premium_users,
            'source_counts': source_counts,
            'verified_sources': [
                'linkedin_verified_network',
                'internshala_tech_feed',
                'wellfound_startup_feed',
                'joborbit_india_feed',
                'joborbit_global_feed',
                'iit_iisc_research_labs',
            ],
        },
        'scheduler': get_scheduler_status(),
        'last_sync': latest_log.to_dict() if latest_log else None,
    })



@admin_bp.route('/sync/status', methods=['GET'])
@limiter.limit("120 per minute")
def get_sync_status():
    """
    GET /api/admin/sync/status
    Public — polled by frontend every 1.2s during active sync.
    No auth required (read-only, non-sensitive).
    """
    return jsonify(sync_service.get_status())


@admin_bp.route('/sync', methods=['POST'])
@limiter.limit("10 per hour")
@require_admin
def trigger_sync():
    """
    POST /api/admin/sync
    Admin-only. Rate limited to 10 per hour (expensive operation).
    Body: { target, mode, pages }
    """
    try:
        data = admin_sync_schema.load(request.get_json(silent=True) or {})
    except MarshmallowValidationError as e:
        return jsonify({'status': 'error', 'error_code': 'VALIDATION_ERROR', 'errors': e.messages}), 400

    try:
        success, message = sync_service.trigger_sync(
            current_app._get_current_object(),
            target=data['target'],
            mode=data['mode'],
            max_pages=data.get('pages'),
        )
    except SyncAlreadyRunningError as e:
        return jsonify(e.to_dict()), e.status_code

    return jsonify({
        'status': 'started',
        'message': message,
        'target': data['target'],
        'mode': data['mode'],
        'pages': data.get('pages'),
    })


@admin_bp.route('/logs', methods=['GET'])
@limiter.limit(settings.RATE_LIMIT_ADMIN)
@require_admin
def get_logs():
    """
    GET /api/admin/logs?limit=20
    Admin-only. Returns scrape audit history.
    """
    limit = min(100, max(1, request.args.get('limit', default=20, type=int)))
    logs = ScrapeLog.query.order_by(ScrapeLog.id.desc()).limit(limit).all()
    return jsonify({
        'status': 'success',
        'logs': [log.to_dict() for log in logs],
    })


# ── Job Inventory CRUD Management Endpoints ─────────────────────────

@admin_bp.route('/jobs', methods=['GET'])
@limiter.limit(settings.RATE_LIMIT_ADMIN)
@require_admin
def admin_get_jobs():
    """
    GET /api/admin/jobs?q=...&page=1&limit=25
    Admin job listings with deletion/audit state.
    """
    q = request.args.get('q', '').strip()
    page = max(1, request.args.get('page', default=1, type=int))
    limit = min(100, max(1, request.args.get('limit', default=25, type=int)))

    jobs, total, global_total = job_repo.search(q=q, page=page, limit=limit)
    return jsonify({
        'status': 'success',
        'jobs': [j.to_dict() for j in jobs],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'global_total': global_total,
            'total_pages': max(1, (total + limit - 1) // limit),
        }
    })


@admin_bp.route('/jobs', methods=['POST'])
@limiter.limit(settings.RATE_LIMIT_ADMIN)
@require_admin
def admin_create_job():
    """
    POST /api/admin/jobs
    Admin manually adds a new job posting.
    Body: { title, company, location, region?, job_type?, pay?, batch?, apply_url?, description?, snippet? }
    """
    data = request.get_json(silent=True) or {}
    title = data.get('title', '').strip()
    company = data.get('company', '').strip()

    if not title or not company:
        return jsonify({'status': 'error', 'message': 'Title and Company are required.'}), 400

    job = job_repo.create(data)
    # Evict cache
    cache.delete('admin_stats')
    cache.delete('job_filters')

    return jsonify({
        'status': 'success',
        'message': f"Job '{job.title}' at '{job.company}' successfully created.",
        'job': job.to_dict()
    }), 201


@admin_bp.route('/jobs/<int:job_id>', methods=['PUT'])
@limiter.limit(settings.RATE_LIMIT_ADMIN)
@require_admin
def admin_update_job(job_id):
    """
    PUT /api/admin/jobs/<id>
    Admin updates an existing job posting.
    """
    data = request.get_json(silent=True) or {}
    job = job_repo.update(job_id, data)
    if not job:
        return jsonify({'status': 'error', 'message': f'Job ID {job_id} not found.'}), 404

    # Evict cache
    cache.delete('admin_stats')

    return jsonify({
        'status': 'success',
        'message': f"Job ID {job_id} successfully updated.",
        'job': job.to_dict()
    })


@admin_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@limiter.limit(settings.RATE_LIMIT_ADMIN)
@require_admin
def admin_delete_job(job_id):
    """
    DELETE /api/admin/jobs/<id>?hard=false
    Admin deletes a job posting (soft-delete by default, hard delete if ?hard=true).
    """
    hard = request.args.get('hard', 'false').lower() == 'true'
    if hard:
        success = job_repo.hard_delete(job_id)
    else:
        success = job_repo.soft_delete(job_id)

    if not success:
        return jsonify({'status': 'error', 'message': f'Job ID {job_id} not found.'}), 404

    # Evict cache
    cache.delete('admin_stats')

    return jsonify({
        'status': 'success',
        'message': f"Job ID {job_id} successfully deleted ({'hard' if hard else 'soft'})."
    })


# ── Dedicated Targeted Scraper Endpoints ─────────────────────────────

@admin_bp.route('/scrape/linkedin', methods=['POST'])
@limiter.limit("20 per hour")
@require_admin
def admin_scrape_linkedin():
    """
    POST /api/admin/scrape/linkedin
    Admin-only dedicated LinkedIn crawler run.
    Body: { keywords: 'sde intern', location: 'India', limit: 20 }
    Extracts up to 20 jobs with jitter delays, recruiter emails,
    and ingests directly into JobOrbit database.
    """
    data = request.get_json(silent=True) or {}
    keywords = (data.get('keywords') or 'sde intern').strip()
    location = (data.get('location') or 'India').strip()
    limit = min(25, max(1, data.get('limit', 20)))

    try:
        from scraper.linkedin_scraper import LinkedInScraper
        scraper = LinkedInScraper()
        results = scraper.search_jobs(
            keywords=keywords,
            location=location,
            limit=limit,
            fetch_details=True,
        )
        sync_stats = scraper.sync_to_database(results)

        # Evict cache
        cache.delete('admin_stats')
        cache.delete('job_filters')

        return jsonify({
            'status': 'success',
            'message': f"LinkedIn run finished. Extracted {len(results)} jobs (+{sync_stats.get('added_jobs', 0)} new, {sync_stats.get('updated_jobs', 0)} refreshed, +{sync_stats.get('added_hrs', 0)} HR leads).",
            'stats': sync_stats,
            'keywords': keywords,
            'location': location,
            'count': len(results),
            'jobs': results,
        })
    except Exception as e:
        current_app.logger.error(f"LinkedIn Scraper error: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': f"LinkedIn scraper failed: {str(e)}"}), 500


@admin_bp.route('/scrape/internshala', methods=['POST'])
@limiter.limit("30 per hour")
@require_admin
def admin_scrape_internshala():
    """
    POST /api/admin/scrape/internshala
    Admin-only dedicated Internshala crawler run (100% public, no cookies required).
    Body: { category: 'remote', limit: 20 }
    """
    data = request.get_json(silent=True) or {}
    category = (data.get('category') or 'remote').strip()
    limit = min(30, max(1, data.get('limit', 20)))

    try:
        from scraper.internshala_scraper import InternshalaScraper
        scraper = InternshalaScraper()
        results = scraper.scrape_internships(
            category=category,
            limit=limit,
        )
        sync_stats = scraper.sync_to_database(results)

        # Evict cache
        cache.delete('admin_stats')
        cache.delete('job_filters')

        return jsonify({
            'status': 'success',
            'message': f"Internshala run finished. Extracted {len(results)} internships (+{sync_stats.get('added_jobs', 0)} new in DB).",
            'stats': sync_stats,
            'category': category,
            'count': len(results),
            'jobs': results,
        })
    except Exception as e:
        current_app.logger.error(f"Internshala Scraper error: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': f"Internshala scraper failed: {str(e)}"}), 500


