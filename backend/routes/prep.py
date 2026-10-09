"""
routes/prep.py
--------------
Technical Interview Vault (AI Engineer & System Design).
Delegates all queries to PrepRepository with rate limiting and caching.
"""
from flask import Blueprint, jsonify, request
from core.extensions import limiter, cache
from core.config import settings
from repositories.prep_repository import prep_repo
from core.exceptions import NotFoundError

prep_bp = Blueprint('prep', __name__, url_prefix='/api/prep')


@prep_bp.route('/tracks', methods=['GET'])
@limiter.limit("120 per minute")
@cache.cached(timeout=settings.CACHE_TTL_PREP, key_prefix='prep_tracks')
def get_tracks():
    """
    GET /api/prep/tracks
    Returns tracks with question counts and topic breakdowns.
    Cached for 1 hour.
    """
    tracks, total = prep_repo.get_tracks_summary()
    return jsonify({
        'status': 'success',
        'tracks': tracks,
        'total_questions': total
    })


@prep_bp.route('/questions', methods=['GET'])
@limiter.limit("60 per minute")
@cache.cached(
    timeout=600,
    key_prefix=lambda: f"prep_q_{request.args.get('track','')}_{request.args.get('topic','')}_{request.args.get('difficulty','')}_{request.args.get('q','')}_{request.args.get('page','1')}"
)
def get_questions():
    """
    GET /api/prep/questions
    Query params: track, topic, difficulty, q, page, limit
    Cached for 10 min. Rate limited: 60/min.
    """
    track = request.args.get('track', '').strip()
    topic = request.args.get('topic', '').strip()
    difficulty = request.args.get('difficulty', '').strip()
    q = request.args.get('q', '').strip()
    page = max(1, request.args.get('page', default=1, type=int))
    limit = min(100, max(1, request.args.get('limit', default=20, type=int)))

    questions, total = prep_repo.search(
        track=track,
        topic=topic,
        difficulty=difficulty,
        q=q,
        page=page,
        limit=limit
    )

    return jsonify({
        'status': 'success',
        'pagination': {
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': max(1, (total + limit - 1) // limit)
        },
        'questions': [item.to_dict() for item in questions]
    })


@prep_bp.route('/questions/<int:question_id>', methods=['GET'])
@limiter.limit("120 per minute")
def get_question(question_id: int):
    """
    GET /api/prep/questions/<id>
    """
    question = prep_repo.get_by_id(question_id)
    if not question:
        raise NotFoundError("Question not found")
    return jsonify({
        'status': 'success',
        'question': question.to_dict()
    })
