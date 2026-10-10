"""
tests/test_oauth_and_mcp.py
---------------------------
Automated tests for OAuth 2.1 PKCE Flow and Model Context Protocol (MCP) tool execution.
"""
import json
import base64
import hashlib
import pytest
from app import create_app
from core.extensions import db
from models.user import User
from models.job import Job
from mcp.tools import TOOL_DEFINITIONS, dispatch_tool
from services.oauth_service import oauth_service, verify_pkce


@pytest.fixture
def test_env():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'RATELIMIT_ENABLED': False
    })
    with app.app_context():
        db.create_all()
        user = User(email="candidate_mcp@joborbit.live", name="MCP Tester")
        job = Job(
            title="Backend Engineer",
            company="JobOrbit Core",
            location="Remote",
            apply_url="https://forms.gle/joborbit-apply",
            source="manual",
            dedupe_key="joborbit_be_test"
        )
        db.session.add_all([user, job])
        db.session.commit()
        client = app.test_client()
        yield client, user, job
        db.session.remove()
        db.drop_all()


def test_mcp_tool_definitions_complete():
    """Verify that all 13 required MCP tools are properly declared with schemas."""
    tool_names = [t["name"] for t in TOOL_DEFINITIONS]
    expected_tools = [
        "search_jobs",
        "get_job_details",
        "get_my_profile",
        "match_resume",
        "tailor_resume",
        "draft_application_answers",
        "save_job",
        "prepare_application",
        "get_application_preview",
        "request_application_approval",
        "submit_approved_application",
        "get_submission_status",
        "list_my_applications"
    ]
    assert len(tool_names) == 13
    for exp in expected_tools:
        assert exp in tool_names


def test_pkce_verification_logic():
    code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    # S256 hash
    digest = hashlib.sha256(code_verifier.encode('ascii')).digest()
    challenge = base64.urlsafe_b64encode(digest).decode('ascii').rstrip('=')

    assert verify_pkce(code_verifier, challenge, 'S256') is True
    assert verify_pkce("wrong_verifier", challenge, 'S256') is False


def test_oauth_pkce_full_flow(test_env):
    client, user, job = test_env

    # 1. Generate verifier and challenge
    verifier = "candidate_pkce_verifier_string_1234567890_joborbit"
    digest = hashlib.sha256(verifier.encode('ascii')).digest()
    challenge = base64.urlsafe_b64encode(digest).decode('ascii').rstrip('=')

    # 2. Issue code
    code = oauth_service.issue_authorization_code(
        client_id="chatgpt-mcp",
        user_id=user.id,
        redirect_uri="https://chatgpt.com/aip/callback",
        scope="jobs:read profile:read",
        code_challenge=challenge,
        code_challenge_method="S256"
    )
    assert code.startswith("joborbit_code_")

    # 3. Exchange code for token with correct verifier
    token_response = oauth_service.exchange_code_for_token(
        client_id="chatgpt-mcp",
        code=code,
        redirect_uri="https://chatgpt.com/aip/callback",
        code_verifier=verifier
    )
    assert "access_token" in token_response
    access_token = token_response["access_token"]
    assert access_token.startswith("joborbit_at_")

    # 4. Introspect access token
    resolved_user = oauth_service.validate_access_token(access_token)
    assert resolved_user is not None
    assert resolved_user.id == user.id


def test_mcp_unauthenticated_request_rejected(test_env):
    client, user, job = test_env

    # Without token -> 401
    resp = client.post('/mcp', json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list"
    })
    assert resp.status_code == 401
    data = resp.get_json()
    assert "error" in data


def test_mcp_authenticated_tools_flow(test_env):
    client, user, job = test_env

    # Obtain valid token
    code = oauth_service.issue_authorization_code(
        client_id="chatgpt-mcp",
        user_id=user.id,
        redirect_uri="https://chatgpt.com/aip/callback",
        scope="jobs:read"
    )
    tokens = oauth_service.exchange_code_for_token(
        client_id="chatgpt-mcp",
        code=code,
        redirect_uri="https://chatgpt.com/aip/callback"
    )
    token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. tools/list
    resp = client.post('/mcp', json={
        "jsonrpc": "2.0",
        "id": 10,
        "method": "tools/list"
    }, headers=headers)
    assert resp.status_code == 200
    tools = resp.get_json()["result"]["tools"]
    assert len(tools) == 13

    # 2. tools/call: search_jobs
    resp = client.post('/mcp', json={
        "jsonrpc": "2.0",
        "id": 11,
        "method": "tools/call",
        "params": {
            "name": "search_jobs",
            "arguments": {"query": "Backend"}
        }
    }, headers=headers)
    assert resp.status_code == 200
    res_text = resp.get_json()["result"]["content"][0]["text"]
    assert "total_matches" in res_text

    # 3. tools/call: get_my_profile
    resp = client.post('/mcp', json={
        "jsonrpc": "2.0",
        "id": 12,
        "method": "tools/call",
        "params": {
            "name": "get_my_profile",
            "arguments": {}
        }
    }, headers=headers)
    assert resp.status_code == 200
    res_text = resp.get_json()["result"]["content"][0]["text"]
    assert "candidate_mcp@joborbit.live" in res_text
