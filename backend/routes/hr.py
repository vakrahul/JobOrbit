"""
routes/hr.py
------------
HR contacts endpoint — protected with rate limiting, paywall verification, and caching.
Recruiter emails are strictly paywalled for VIP users. Public requests receive obfuscated emails.
"""
from flask import Blueprint, jsonify, request
from core.extensions import limiter, cache
from core.config import settings
from repositories.hr_repository import hr_repo
from core.exceptions import NotFoundError
from routes.auth import get_current_user_from_request

hr_bp = Blueprint('hr', __name__, url_prefix='/api/hr')


def is_request_premium() -> bool:
    """
    Strict paywall check.
    Returns True only if:
    1. Authenticated user has is_premium == True
    2. Request contains valid VIP session header (X-Premium-User == 'true')
    Defaults to False (strictly locked).
    """
    try:
        user = get_current_user_from_request()
        if user and user.is_premium:
            return True
    except Exception:
        pass

    if request.headers.get('X-Premium-User') == 'true':
        return True

    return False


@hr_bp.route('', methods=['GET'])
@limiter.limit("60 per minute")
@cache.cached(
    timeout=settings.CACHE_TTL_HR,
    key_prefix=lambda: f"hr_list_{request.args.get('q','')}_{request.args.get('company','')}_{request.args.get('page','1')}_{is_request_premium()}"
)
def list_hr_contacts():
    """
    GET /api/hr
    Query params: q, company, niche, page, limit
    Cached for 10 min per auth tier. Rate limited: 60/min.
    Emails masked unless caller has verified VIP session.
    """
    q = request.args.get('q', '').strip()
    company = request.args.get('company', '').strip()
    niche = request.args.get('niche', '').strip()
    page = max(1, request.args.get('page', default=1, type=int))
    limit = min(100, max(1, request.args.get('limit', default=24, type=int)))
    is_premium = is_request_premium()

    contacts, total = hr_repo.search(
        q=q,
        company=company,
        niche=niche,
        page=page,
        limit=limit
    )

    return jsonify({
        'status': 'success',
        'total': total,
        'page': page,
        'limit': limit,
        'is_premium_caller': is_premium,
        'contacts': [c.to_dict(is_premium=is_premium) for c in contacts]
    })


@hr_bp.route('/<int:hr_id>', methods=['GET'])
@limiter.limit("120 per minute")
def get_hr_contact(hr_id: int):
    """
    GET /api/hr/<id>
    """
    is_premium = is_request_premium()
    contact = hr_repo.get_by_id(hr_id)
    if not contact:
        raise NotFoundError("HR contact not found")
    return jsonify({
        'status': 'success',
        'is_premium_caller': is_premium,
        'contact': contact.to_dict(is_premium=is_premium)
    })
