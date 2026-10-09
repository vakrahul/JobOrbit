"""
core/auth_guard.py
------------------
Decorator-based auth guards for route protection.
"""
from functools import wraps
from flask import request, jsonify, g
from core.config import settings
from core.exceptions import AuthError, ForbiddenError


def require_admin(f):
    """
    Protects admin routes with a static ADMIN_TOKEN.
    Token must be sent via:
      - Header:  X-Admin-Token: <token>
      - Query:   ?admin_token=<token>
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = (
            request.headers.get("X-Admin-Token")
            or request.args.get("admin_token", "")
        )
        if not token or token != settings.ADMIN_TOKEN:
            return jsonify({
                "status": "error",
                "error_code": "UNAUTHORIZED",
                "message": "Admin access denied. Provide a valid X-Admin-Token header."
            }), 401
        return f(*args, **kwargs)
    return decorated


def require_premium(f):
    """
    Protects premium endpoints.
    In a full auth setup this would check a JWT session.
    For now checks the X-Premium-Token or session cookie.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Placeholder — wire up real session check when Google OAuth is active
        is_premium = request.headers.get("X-Premium-User") == "true"
        g.is_premium = is_premium
        return f(*args, **kwargs)
    return decorated


def optional_auth(f):
    """
    Non-blocking auth: sets g.is_premium flag but doesn't reject requests.
    Use on public endpoints where premium users get enhanced data.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        is_premium = request.headers.get("X-Premium-User") == "true"
        g.is_premium = is_premium
        return f(*args, **kwargs)
    return decorated
