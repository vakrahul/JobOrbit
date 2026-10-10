"""
routes/mcp_routes.py
--------------------
Model Context Protocol (MCP) server endpoints over HTTP JSON-RPC and SSE:
- POST /mcp (JSON-RPC 2.0 tool execution & initialization)
- GET /mcp/sse (Server-Sent Events stream for MCP sessions)
- GET /mcp/manifest (Server metadata and capabilities)
- GET /.well-known/mcp (Discovery endpoint)

Strictly enforces OAuth 2.1 authentication and user context resolution.
"""
import json
import uuid
import logging
from flask import Blueprint, request, jsonify, Response, current_app
from core.extensions import limiter
from core.config import settings
from mcp.tools import TOOL_DEFINITIONS, dispatch_tool
from services.oauth_service import oauth_service
from routes.auth import get_current_user_from_request

logger = logging.getLogger(__name__)

mcp_bp = Blueprint('mcp', __name__)


def resolve_mcp_user():
    """
    Resolves the authenticated user from the Authorization header.
    Supports:
    1. OAuth 2.1 access tokens (issued via /oauth/token)
    2. JobOrbit JWT bearer tokens
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header:
        # Check query param for SSE initial connection if provided
        token_param = request.args.get('access_token')
        if token_param:
            auth_header = f"Bearer {token_param}"

    if not auth_header or not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split(' ', 1)[1].strip()

    # Try OAuth access token first
    user = oauth_service.validate_access_token(token)
    if user:
        return user

    # Fallback to standard JWT
    user = get_current_user_from_request()
    return user


@mcp_bp.route('/mcp/manifest', methods=['GET'])
@mcp_bp.route('/.well-known/mcp', methods=['GET'])
def mcp_manifest():
    proto = request.headers.get('X-Forwarded-Proto', request.scheme or 'https')
    host = request.headers.get('X-Forwarded-Host', request.host)
    base_url = f"{proto}://{host}".rstrip('/')
    return jsonify({
        "schema_version": "v1",
        "name_for_model": "joborbit",
        "name_for_human": "JobOrbit",
        "description_for_model": "Autonomous Job Search, Resume Tailoring, and Application Preparation powered by Gemini AI and JobOrbit. Every job submission requires explicit human approval.",
        "description_for_human": "Find jobs, tailor resumes with Gemini AI, and prepare applications on JobOrbit.",
        "auth": {
            "type": "oauth",
            "authorization_url": f"{base_url}/oauth/authorize",
            "token_url": f"{base_url}/oauth/token",
            "scope": "jobs:read jobs:apply profile:read"
        },
        "mcp": {
            "endpoint": f"{base_url}/mcp",
            "protocol_version": "2024-11-05",
            "tools_count": len(TOOL_DEFINITIONS)
        }
    })


@mcp_bp.route('/mcp', methods=['POST'])
@limiter.limit("120 per minute")
def mcp_jsonrpc():
    """
    JSON-RPC 2.0 handler for MCP protocol messages:
    - initialize
    - tools/list
    - tools/call
    - ping
    """
    payload = request.get_json(silent=True) or {}
    req_id = payload.get('id')
    method = payload.get('method')
    params = payload.get('params') or {}

    # 1. Initialize method does not require user authentication
    if method == 'initialize':
        return jsonify({
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {
                        "listChanged": False
                    }
                },
                "serverInfo": {
                    "name": "joborbit-mcp-server",
                    "version": "1.0.0"
                }
            }
        })

    if method == 'notifications/initialized':
        return jsonify({"jsonrpc": "2.0", "id": req_id, "result": {}})

    if method == 'ping':
        return jsonify({"jsonrpc": "2.0", "id": req_id, "result": {}})

    # 2. Authenticate user for all tools endpoints
    user = resolve_mcp_user()
    if not user:
        return jsonify({
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32001,
                "message": "Unauthorized. Please authenticate using OAuth 2.1 Bearer token."
            }
        }), 401

    if method == 'tools/list':
        return jsonify({
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": TOOL_DEFINITIONS
            }
        })

    elif method == 'tools/call':
        tool_name = params.get('name')
        arguments = params.get('arguments') or {}

        if not tool_name:
            return jsonify({
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32602,
                    "message": "Missing required parameter 'name'."
                }
            }), 400

        result = dispatch_tool(user, tool_name, arguments)
        return jsonify({
            "jsonrpc": "2.0",
            "id": req_id,
            "result": result
        })

    else:
        return jsonify({
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32601,
                "message": f"Method '{method}' not found."
            }
        }), 404


@mcp_bp.route('/mcp/sse', methods=['GET'])
def mcp_sse():
    """
    Server-Sent Events endpoint for MCP clients connecting over SSE.
    """
    session_id = str(uuid.uuid4())

    def event_stream():
        # First event informs the client where to post messages
        post_endpoint = f"/mcp?session_id={session_id}"
        yield f"event: endpoint\ndata: {post_endpoint}\n\n"

    return Response(event_stream(), content_type='text/event-stream', headers={
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive'
    })
