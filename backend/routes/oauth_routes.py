"""
routes/oauth_routes.py
----------------------
OAuth 2.1 Provider endpoints for ChatGPT MCP and external agent integration:
- RFC 8414 Authorization Server Metadata (/.well-known/oauth-authorization-server)
- Authorization Endpoint (/oauth/authorize) with PKCE (S256)
- Token Exchange Endpoint (/oauth/token)
"""
import urllib.parse
from flask import Blueprint, request, jsonify, redirect, render_template_string, make_response
from core.extensions import limiter
from core.config import settings
from services.oauth_service import oauth_service
from repositories.user_repository import user_repo

oauth_bp = Blueprint('oauth', __name__)

AUTHORIZATION_CONSENT_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize ChatGPT — JobOrbit</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #fdfbf7;
      color: #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e5e0d8;
      border-radius: 16px;
      max-width: 440px;
      width: 100%;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .logo {
      font-size: 22px;
      font-weight: 800;
      color: #1e3a8a;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .scope-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #334155;
    }
    .scope-box ul {
      margin-left: 20px;
      margin-top: 6px;
    }
    .scope-box li {
      margin-bottom: 4px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 11px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      background: #ffffff;
    }
    input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
    }
    .btn {
      width: 100%;
      padding: 12px;
      background: #0f172a;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      transition: background 0.15s ease;
    }
    .btn:hover {
      background: #1e293b;
    }
    .error-msg {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">JobOrbit &times; ChatGPT</div>
    <div class="subtitle">Connect your JobOrbit candidate account to ChatGPT using the Model Context Protocol (MCP).</div>
    
    {% if error %}
    <div class="error-msg">{{ error }}</div>
    {% endif %}

    <div class="scope-box">
      <strong>Authorized Permissions:</strong>
      <ul>
        <li>Search jobs and view job specifications</li>
        <li>Review your verified profile and saved jobs</li>
        <li>Draft applications using Gemini AI (requires explicit human approval for each submission)</li>
      </ul>
    </div>

    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="{{ client_id }}">
      <input type="hidden" name="redirect_uri" value="{{ redirect_uri }}">
      <input type="hidden" name="scope" value="{{ scope }}">
      <input type="hidden" name="state" value="{{ state }}">
      <input type="hidden" name="code_challenge" value="{{ code_challenge }}">
      <input type="hidden" name="code_challenge_method" value="{{ code_challenge_method }}">

      <div class="form-group">
        <label>JobOrbit Email Address</label>
        <input type="email" name="email" required placeholder="candidate@example.com" value="{{ email or '' }}" />
      </div>

      <div class="form-group">
        <label>JobOrbit Password</label>
        <input type="password" name="password" required placeholder="Enter your password" />
      </div>

      <button type="submit" class="btn">Authorize ChatGPT Connection</button>
    </form>

    <div class="footer">
      Protected by OAuth 2.1 with PKCE (S256). All job submissions require explicit one-time confirmation.
    </div>
  </div>
</body>
</html>
"""


@oauth_bp.route('/.well-known/oauth-authorization-server', methods=['GET'])
def oauth_metadata():
    """RFC 8414 OAuth 2.0 Authorization Server Metadata"""
    base_url = settings.APP_URL.rstrip('/') if hasattr(settings, 'APP_URL') and settings.APP_URL else "https://api.joborbit.live"
    return jsonify({
        "issuer": base_url,
        "authorization_endpoint": f"{base_url}/oauth/authorize",
        "token_endpoint": f"{base_url}/oauth/token",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code"],
        "token_endpoint_auth_methods_supported": ["none", "client_secret_post"],
        "code_challenge_methods_supported": ["S256"],
        "scopes_supported": [
            "jobs:read",
            "jobs:apply",
            "profile:read",
            "resume:read",
            "resume:write"
        ]
    })


@oauth_bp.route('/oauth/authorize', methods=['GET', 'POST'])
def oauth_authorize():
    if request.method == 'GET':
        client_id = request.args.get('client_id') or 'chatgpt-mcp'
        redirect_uri = request.args.get('redirect_uri') or 'https://chatgpt.com/aip/callback'
        scope = request.args.get('scope', 'jobs:read jobs:apply profile:read')
        state = request.args.get('state', '')
        code_challenge = request.args.get('code_challenge', '')
        code_challenge_method = request.args.get('code_challenge_method', 'S256')

        return render_template_string(
            AUTHORIZATION_CONSENT_TEMPLATE,
            client_id=client_id,
            redirect_uri=redirect_uri,
            scope=scope,
            state=state,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
            error=None
        )

    # POST: Process credentials and issue code
    client_id = request.form.get('client_id') or 'chatgpt-mcp'
    redirect_uri = request.form.get('redirect_uri') or ''
    scope = request.form.get('scope') or 'jobs:read'
    state = request.form.get('state') or ''
    code_challenge = request.form.get('code_challenge') or ''
    code_challenge_method = request.form.get('code_challenge_method') or 'S256'

    email = (request.form.get('email') or '').strip().lower()
    password = (request.form.get('password') or '').strip()

    user = user_repo.get_by_email(email)
    if not user:
        if len(password) < 4:
            return render_template_string(
                AUTHORIZATION_CONSENT_TEMPLATE,
                client_id=client_id,
                redirect_uri=redirect_uri,
                scope=scope,
                state=state,
                code_challenge=code_challenge,
                code_challenge_method=code_challenge_method,
                email=email,
                error="Password must be at least 4 characters."
            ), 400
        # Automatically register user with lifetime access
        user = user_repo.create_user_with_password(
            email=email,
            name=email.split('@')[0],
            password=password
        )
        user.is_premium = True
        user.premium_tier = 'lifetime'
        from core.extensions import db
        db.session.commit()
    elif not user.password_hash:
        # User signed in via Google OAuth or demo without local password -> set it now!
        user_repo.set_user_password(user, password)
    elif not user_repo.verify_password(user, password):
        return render_template_string(
            AUTHORIZATION_CONSENT_TEMPLATE,
            client_id=client_id,
            redirect_uri=redirect_uri,
            scope=scope,
            state=state,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
            email=email,
            error="Incorrect password for this account. Please re-enter your password."
        ), 400

    try:
        code = oauth_service.issue_authorization_code(
            client_id=client_id,
            user_id=user.id,
            redirect_uri=redirect_uri,
            scope=scope,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method
        )
        sep = '&' if '?' in redirect_uri else '?'
        params = {'code': code}
        if state:
            params['state'] = state
        target = f"{redirect_uri}{sep}{urllib.parse.urlencode(params)}"
        return redirect(target)
    except Exception as e:
        return render_template_string(
            AUTHORIZATION_CONSENT_TEMPLATE,
            client_id=client_id,
            redirect_uri=redirect_uri,
            scope=scope,
            state=state,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
            email=email,
            error=str(e)
        ), 400


@oauth_bp.route('/oauth/token', methods=['POST'])
@limiter.limit("60 per minute")
def oauth_token():
    grant_type = request.form.get('grant_type') or (request.json or {}).get('grant_type')
    if grant_type != 'authorization_code':
        return jsonify({
            'error': 'unsupported_grant_type',
            'error_description': 'Only authorization_code grant is supported.'
        }), 400

    client_id = request.form.get('client_id') or (request.json or {}).get('client_id') or 'chatgpt-mcp'
    code = request.form.get('code') or (request.json or {}).get('code')
    redirect_uri = request.form.get('redirect_uri') or (request.json or {}).get('redirect_uri')
    code_verifier = request.form.get('code_verifier') or (request.json or {}).get('code_verifier')

    if not code or not redirect_uri:
        return jsonify({
            'error': 'invalid_request',
            'error_description': 'code and redirect_uri parameters are required.'
        }), 400

    try:
        token_data = oauth_service.exchange_code_for_token(
            client_id=client_id,
            code=code,
            redirect_uri=redirect_uri,
            code_verifier=code_verifier
        )
        return jsonify(token_data)
    except Exception as e:
        return jsonify({
            'error': 'invalid_grant',
            'error_description': str(e)
        }), 400
