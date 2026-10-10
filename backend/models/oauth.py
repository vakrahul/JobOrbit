"""
models/oauth.py
---------------
OAuth 2.1 Provider models for ChatGPT MCP integration:
- OAuth Clients (ChatGPT, IDEs, Webhook agents)
- Authorization Codes with PKCE (S256)
- Scoped Bearer Access Tokens and Refresh Tokens
"""
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from core.extensions import db
from models.base import BaseModel


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _to_naive_utc(dt):
    if dt is None:
        return None
    if getattr(dt, 'tzinfo', None) is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class OAuthClient(BaseModel):
    __tablename__ = 'oauth_clients'

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.String(128), unique=True, nullable=False, index=True)
    client_secret_hash = db.Column(db.String(255), nullable=True)  # Nullable for public clients with PKCE
    client_name = db.Column(db.String(255), nullable=False)
    redirect_uris_json = db.Column(db.JSON, default=list, nullable=False)  # Allowed redirect URLs
    scopes = db.Column(db.String(512), default="jobs:read jobs:apply profile:read resume:read resume:write")
    is_confidential = db.Column(db.Boolean, default=False)

    def check_redirect_uri(self, uri: str) -> bool:
        if not uri:
            return False
        allowed = self.redirect_uris_json or []
        # Support exact match or localhost for local testing
        clean_uri = uri.strip().rstrip('/')
        return any(clean_uri == a.strip().rstrip('/') or clean_uri.startswith(a.strip()) for a in allowed)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'client_id': self.client_id,
            'client_name': self.client_name,
            'redirect_uris': self.redirect_uris_json or [],
            'scopes': self.scopes,
            'is_confidential': self.is_confidential,
        }


class OAuthAuthorizationCode(BaseModel):
    __tablename__ = 'oauth_authorization_codes'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(128), unique=True, nullable=False, index=True)
    client_id = db.Column(db.String(128), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    redirect_uri = db.Column(db.String(1024), nullable=False)
    scope = db.Column(db.String(512), nullable=True)

    # PKCE verification fields
    code_challenge = db.Column(db.String(128), nullable=True)
    code_challenge_method = db.Column(db.String(20), default='S256')  # 'S256' or 'plain'

    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship('User', backref=db.backref('oauth_codes', lazy='dynamic', cascade='all, delete-orphan'))

    def is_valid(self, client_id: str, redirect_uri: str) -> bool:
        now = _now()
        if self.is_used:
            return False
        if self.expires_at and _to_naive_utc(self.expires_at) < now:
            return False
        if self.client_id != client_id:
            return False
        clean_target = redirect_uri.strip().rstrip('/')
        clean_stored = self.redirect_uri.strip().rstrip('/')
        return clean_target == clean_stored


class OAuthToken(BaseModel):
    __tablename__ = 'oauth_tokens'

    id = db.Column(db.Integer, primary_key=True)
    access_token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    refresh_token = db.Column(db.String(255), unique=True, nullable=True, index=True)
    client_id = db.Column(db.String(128), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    scope = db.Column(db.String(512), default="jobs:read profile:read")
    token_type = db.Column(db.String(50), default="Bearer")

    expires_at = db.Column(db.DateTime, nullable=False)
    revoked = db.Column(db.Boolean, default=False, nullable=False, index=True)

    user = db.relationship('User', backref=db.backref('oauth_tokens', lazy='dynamic', cascade='all, delete-orphan'))

    @property
    def is_expired(self) -> bool:
        return _to_naive_utc(self.expires_at) < _now()

    def is_active(self) -> bool:
        return not self.revoked and not self.is_expired
