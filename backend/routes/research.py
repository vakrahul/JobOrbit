"""
routes/research.py
------------------
IIT/IISc Research Labs directory endpoint.
Delegates all queries to ResearchRepository with rate limiting and caching.
"""
from flask import Blueprint, jsonify, request
from core.extensions import limiter, cache
from core.config import settings
from repositories.research_repository import research_repo
from core.exceptions import NotFoundError

research_bp = Blueprint('research', __name__, url_prefix='/api/research')


@research_bp.route('', methods=['GET'])
@limiter.limit("60 per minute")
@cache.cached(
    timeout=settings.CACHE_TTL_RESEARCH,
    key_prefix=lambda: f"research_list_{request.args.get('q','')}_{request.args.get('institute','')}_{request.args.get('department','')}_{request.args.get('page','1')}"
)
def list_professors():
    """
    GET /api/research
    Query params: q, institute, department, page, limit
    Cached for 10 min. Rate limited: 60/min.
    """
    page = max(1, request.args.get('page', default=1, type=int))
    limit = min(100, max(1, request.args.get('limit', default=24, type=int)))
    q = request.args.get('q', '').strip()
    institute = request.args.get('institute', '').strip()
    department = request.args.get('department', '').strip()

    professors, total = research_repo.search(
        q=q,
        institute=institute,
        department=department,
        page=page,
        limit=limit
    )

    top_institutes = research_repo.get_top_institutes(limit=15)

    return jsonify({
        'status': 'success',
        'pagination': {
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': max(1, (total + limit - 1) // limit)
        },
        'institutes': top_institutes,
        'professors': [p.to_dict() for p in professors]
    })


@research_bp.route('/institutes', methods=['GET'])
@limiter.limit("120 per minute")
@cache.cached(timeout=1800, key_prefix='research_all_institutes')
def get_institutes():
    """
    GET /api/research/institutes
    Cached for 30 min.
    """
    return jsonify({
        'status': 'success',
        'institutes': research_repo.get_all_institutes()
    })


@research_bp.route('/<int:prof_id>', methods=['GET'])
@limiter.limit("120 per minute")
def get_professor(prof_id: int):
    """
    GET /api/research/<id>
    """
    prof = research_repo.get_by_id(prof_id)
    if not prof:
        raise NotFoundError("Professor not found")
    return jsonify({
        'status': 'success',
        'professor': prof.to_dict()
    })
