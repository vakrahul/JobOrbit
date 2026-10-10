"""
services/oauth_service.py
-------------------------
OAuth 2.1 Authorization Code Flow with PKCE (S256) implementation:
- Client registration & validation
- Authorization code issuance with PKCE challenge
- Code exchange with PKCE verifier validation
- Bearer access token generation & introspection
"""
import base64
import hashlib
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple

from core.extensions import db
from core.exceptions import ValidationError, UnauthorizedError, NotFoundError
from models.oauth import OAuthClient, OAuthAuthorizationCode, OAuthToken
from models.user import User

logger = logging.getLogger(__name__)


def _utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def verify_pkce(code_verifier: str, code_challenge: str, method: str = 'S256') -> bool:
    if not code_challenge:
        return True  # If no challenge was registered (backward-compatibility)
    if not code_verifier:
        return False
    if method == 'plain':
        return code_verifier == code_challenge
    elif method == 'S256':
        # Base64url-encoded SHA-256 hash without padding
        digest = hashlib.sha256(code_verifier.encode('ascii')).digest()
        computed = base64.urlsafe_b64encode(digest).decode('ascii').rstrip('=')
        clean_challenge = code_challenge.rstrip('=')
        return computed == clean_challenge
    return False


class OAuthService:

    def get_or_create_client(
        self,
        client_id: str,
        client_name: str = "ChatGPT MCP Client",
        redirect_uris: Optional[list] = None
    ) -> OAuthClient:
        client = OAuthClient.query.filter_by(client_id=client_id).first()
        if not client:
            client = OAuthClient(
                client_id=client_id,
                client_name=client_name,
                redirect_uris_json=redirect_uris or [
                    "https://chatgpt.com/aip/callback",
                    "https://chat.openai.com/aip/callback",
                    "https://oauth.pstmn.io/v1/callback",
                    "http://localhost:3000/callback"
                ],
                scopes="jobs:read jobs:apply profile:read resume:read resume:write"
            )
            db.session.add(client)
            db.session.commit()
        return client

    def issue_authorization_code(
        self,
        client_id: str,
        user_id: int,
        redirect_uri: str,
        scope: Optional[str] = None,
        code_challenge: Optional[str] = None,
        code_challenge_method: str = 'S256'
    ) -> str:
        client = self.get_or_create_client(client_id)
        if not client.check_redirect_uri(redirect_uri):
            raise ValidationError(f"Redirect URI '{redirect_uri}' is not authorized for this client.")

        code = f"joborbit_code_{secrets.token_urlsafe(32)}"
        expires_at = _utc_now() + timedelta(minutes=10)

        auth_code = OAuthAuthorizationCode(
            code=code,
            client_id=client_id,
            user_id=user_id,
            redirect_uri=redirect_uri,
            scope=scope or client.scopes,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method or 'S256',
            expires_at=expires_at,
            is_used=False
        )
        db.session.add(auth_code)
        db.session.commit()
        return code

    def exchange_code_for_token(
        self,
        client_id: str,
        code: str,
        redirect_uri: str,
        code_verifier: Optional[str] = None
    ) -> Dict[str, Any]:
        auth_code = OAuthAuthorizationCode.query.filter_by(code=code).first()
        if not auth_code:
            raise ValidationError("Invalid authorization code.")

        if not auth_code.is_valid(client_id, redirect_uri):
            raise ValidationError("Authorization code has expired, been used, or details mismatch.")

        # PKCE verification
        if auth_code.code_challenge:
            if not code_verifier:
                raise ValidationError("code_verifier is required for PKCE-secured requests.")
            if not verify_pkce(code_verifier, auth_code.code_challenge, auth_code.code_challenge_method):
                raise ValidationError("PKCE verification failed: invalid code_verifier.")

        # Mark code as consumed
        auth_code.is_used = True

        # Generate tokens
        access_token = f"joborbit_at_{secrets.token_urlsafe(48)}"
        refresh_token = f"joborbit_rt_{secrets.token_urlsafe(48)}"
        expires_in = 86400 * 30  # 30 days valid for ChatGPT sessions
        expires_at = _utc_now() + timedelta(seconds=expires_in)

        token = OAuthToken(
            access_token=access_token,
            refresh_token=refresh_token,
            client_id=client_id,
            user_id=auth_code.user_id,
            scope=auth_code.scope,
            token_type="Bearer",
            expires_at=expires_at
        )
        db.session.add(token)
        db.session.commit()

        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": expires_in,
            "refresh_token": refresh_token,
            "scope": auth_code.scope
        }

    def validate_access_token(self, access_token: str) -> Optional[User]:
        if not access_token:
            return None
        # Support 'Bearer <token>' prefix if passed
        token_str = access_token.replace("Bearer ", "").strip()
        token = OAuthToken.query.filter_by(access_token=token_str).first()
        if not token or not token.is_active():
            return None

        user = db.session.get(User, token.user_id)
        return user


oauth_service = OAuthService()
