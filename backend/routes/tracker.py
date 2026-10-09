"""
routes/tracker.py
-----------------
Application pipeline CRM (Saved, Applied, Interviewing, Offer).
Delegates all queries to UserRepository.
"""
from flask import Blueprint, jsonify, request
from core.extensions import limiter
from core.exceptions import NotFoundError, ValidationError
from repositories.user_repository import user_repo
from repositories.job_repository import job_repo

tracker_bp = Blueprint('tracker', __name__, url_prefix='/api/tracker')


@tracker_bp.route('', methods=['GET'])
@limiter.limit("60 per minute")
def get_tracked_jobs():
    """
    GET /api/tracker?status=saved|applied|interviewing|offer|all
    """
    user = user_repo.get_default_or_create()
    status_filter = request.args.get('status', '').strip().lower()

    items = user_repo.get_user_saved_jobs(user.id, status=status_filter)

    return jsonify({
        'status': 'success',
        'total': len(items),
        'items': [item.to_dict() for item in items]
    })


@tracker_bp.route('/save', methods=['POST'])
@limiter.limit("60 per minute")
def save_or_update_job():
    """
    POST /api/tracker/save
    Body: { job_id, status?, notes? }
    """
    user = user_repo.get_default_or_create()
    data = request.get_json(silent=True) or {}
    job_id = data.get('job_id')
    status = data.get('status', 'saved')
    notes = data.get('notes', '')

    if not job_id:
        raise ValidationError("job_id is required")

    job = job_repo.get_by_id(job_id)
    if not job:
        raise NotFoundError("Job not found")

    saved_item, is_new = user_repo.save_or_update_pipeline(
        user_id=user.id,
        job_id=job_id,
        status=status,
        notes=notes
    )

    return jsonify({
        'status': 'success',
        'action': 'created' if is_new else 'updated',
        'item': saved_item.to_dict()
    })


@tracker_bp.route('/<int:job_id>', methods=['DELETE'])
@limiter.limit("60 per minute")
def remove_tracked_job(job_id: int):
    """
    DELETE /api/tracker/<job_id>
    """
    user = user_repo.get_default_or_create()
    removed = user_repo.remove_saved_job(user.id, job_id)

    if not removed:
        raise NotFoundError("Tracked job not found")

    return jsonify({
        'status': 'success',
        'message': f"Job {job_id} removed from tracker"
    })
