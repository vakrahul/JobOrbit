"""
routes/auth.py
--------------
Authentication & User session routes.
"""
from datetime import datetime, timezone, timedelta
import jwt
from flask import Blueprint, jsonify, request, current_app

from core.extensions import limiter
from core.config import settings
from core.exceptions import AuthError, ValidationError
from repositories.user_repository import user_repo

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def generate_jwt(user_id: int, email: str, is_premium: bool) -> str:
    payload = {
        'sub': user_id,
        'email': email,
        'is_premium': is_premium,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    secret = settings.SECRET_KEY or current_app.config['SECRET_KEY']
    return jwt.encode(payload, secret, algorithm='HS256')


def get_current_user_from_request():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        secret = settings.SECRET_KEY or current_app.config['SECRET_KEY']
        decoded = jwt.decode(token, secret, algorithms=['HS256'])
        return user_repo.get_by_id(decoded.get('sub'))
    except Exception:
        return None


@auth_bp.route('/signup', methods=['POST'])
@limiter.limit(settings.RATE_LIMIT_AUTH)
def signup():
    """
    POST /api/auth/signup
    Body: { email, name, password }
    """
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    name = (data.get('name') or '').strip()
    password = (data.get('password') or '').strip()

    if not email or '@' not in email:
        return jsonify({'status': 'error', 'message': 'Please provide a valid email address.'}), 400
    if not password or len(password) < 6:
        return jsonify({'status': 'error', 'message': 'Password must be at least 6 characters long.'}), 400

    try:
        user = user_repo.create_user_with_password(email=email, name=name, password=password)
        token = generate_jwt(user.id, user.email, user.is_premium)
        return jsonify({
            'status': 'success',
            'token': token,
            'user': user.to_dict()
        })
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Failed to create account.'}), 500


@auth_bp.route('/login', methods=['POST'])
@limiter.limit(settings.RATE_LIMIT_AUTH)
def login():
    """
    POST /api/auth/login
    Body: { email, password }
    """
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password are required.'}), 400

    user = user_repo.authenticate_with_password(email, password)
    if not user:
        return jsonify({'status': 'error', 'message': 'Invalid email or password.'}), 401

    token = generate_jwt(user.id, user.email, user.is_premium)
    return jsonify({
        'status': 'success',
        'token': token,
        'user': user.to_dict()
    })


@auth_bp.route('/google', methods=['POST'])
@limiter.limit(settings.RATE_LIMIT_AUTH)
def google_auth():
    """
    POST /api/auth/google
    Body: { email, name?, avatar_url?, credential? }
    """
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    name = (data.get('name') or '').strip()
    avatar = (data.get('avatar_url') or '').strip()

    # If decoding Google ID token payload or direct verified profile
    if not email or '@' not in email:
        return jsonify({'status': 'error', 'message': 'Google authentication missing valid email payload.'}), 400

    if not name:
        name = email.split('@')[0].capitalize()
    if not avatar:
        avatar = f"https://api.dicebear.com/7.x/initials/svg?seed={email}"

    user = user_repo.create_or_update_google_user(email, name, avatar)
    token = generate_jwt(user.id, user.email, user.is_premium)

    return jsonify({
        'status': 'success',
        'token': token,
        'user': user.to_dict()
    })


@auth_bp.route('/me', methods=['GET'])
@limiter.limit("60 per minute")
def get_me():
    """
    GET /api/auth/me
    """
    user = get_current_user_from_request()
    if not user:
        raise AuthError("Not authenticated or invalid token")
    return jsonify({
        'status': 'success',
        'user': user.to_dict()
    })


@auth_bp.route('/mcp-token', methods=['POST'])
def generate_mcp_token():
    """
    POST /api/auth/mcp-token
    Generates a 90-day personal MCP Bearer token for the logged in user.
    """
    user = get_current_user_from_request()
    if not user:
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401

    import secrets
    from datetime import datetime, timezone, timedelta
    from models.oauth import OAuthToken
    from core.extensions import db

    access_token = f"joborbit_at_{secrets.token_urlsafe(48)}"
    token = OAuthToken(
        access_token=access_token,
        client_id="joborbit-direct",
        user_id=user.id,
        scope="jobs:read jobs:apply profile:read resume:read resume:write",
        token_type="Bearer",
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=90)
    )
    db.session.add(token)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'access_token': access_token,
        'mcp_url': "https://prod-main-api-62dc70-00wtatwcawp.compute.instacloud-edge.com/mcp",
        'sse_url': "https://prod-main-api-62dc70-00wtatwcawp.compute.instacloud-edge.com/mcp/sse",
        'expires_in_days': 90
    })

