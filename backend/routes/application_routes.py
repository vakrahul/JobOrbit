"""
routes/application_routes.py
----------------------------
REST API endpoints for candidate application management, review, and submission.
Used by the JobOrbit React frontend and shared with the MCP service.
"""
from flask import Blueprint, request, jsonify
from core.extensions import limiter
from core.exceptions import ValidationError, UnauthorizedError, NotFoundError
from routes.auth import get_current_user_from_request
from services.application_service import application_service
from services.browser_submission_service import browser_submission_service
from models.application import ApplicationApproval, ApplicationDraft

applications_bp = Blueprint('applications', __name__, url_prefix='/api/applications')


@applications_bp.route('', methods=['GET'])
def list_applications():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401
    apps = application_service.list_user_applications(user.id)
    return jsonify({'status': 'success', 'data': apps})


@applications_bp.route('/<int:draft_id>', methods=['GET'])
def get_application(draft_id):
    user = get_current_user_from_request()
    if not user:
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401
    draft = application_service.get_draft(user.id, draft_id)
    return jsonify({'status': 'success', 'data': draft.to_dict()})


@applications_bp.route('', methods=['POST'])
def create_application():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401

    data = request.get_json(silent=True) or {}
    draft = application_service.create_draft(
        user_id=user.id,
        target_role=data.get('target_role', ''),
        company_name=data.get('company_name', ''),
        destination_url=data.get('destination_url', ''),
        resume_text=data.get('resume_text', ''),
        job_id=data.get('job_id'),
        answers=data.get('answers', {}),
        declarations=data.get('declarations', {}),
        resume_version_id=data.get('resume_version_id'),
        notes=data.get('notes')
    )
    return jsonify({'status': 'success', 'data': draft.to_dict()}), 201


@applications_bp.route('/<int:draft_id>', methods=['PUT'])
def update_application(draft_id):
    user = get_current_user_from_request()
    if not user:
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401

    data = request.get_json(silent=True) or {}
    draft = application_service.update_draft(
        user_id=user.id,
        draft_id=draft_id,
        target_role=data.get('target_role'),
        company_name=data.get('company_name'),
        destination_url=data.get('destination_url'),
        resume_text=data.get('resume_text'),
        answers=data.get('answers'),
        declarations=data.get('declarations'),
        notes=data.get('notes')
    )
    return jsonify({'status': 'success', 'data': draft.to_dict()})


@applications_bp.route('/<int:draft_id>/request-approval', methods=['POST'])
def request_approval(draft_id):
    user = get_current_user_from_request()
    if not user:
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401

    approval_payload = application_service.request_approval(user.id, draft_id)
    return jsonify({'status': 'success', 'data': approval_payload})


@applications_bp.route('/review/<approval_token>', methods=['GET'])
def get_approval_review_data(approval_token):
    """
    Public or candidate-authenticated preview endpoint for the approval review modal.
    Shows exactly what answers, resume snapshot, and company details will be submitted.
    """
    approval = ApplicationApproval.query.filter_by(approval_token=approval_token).first()
    if not approval:
        return jsonify({'status': 'error', 'message': 'Invalid or expired approval token.'}), 404

    draft = ApplicationDraft.query.get(approval.draft_id)
    if not draft:
        return jsonify({'status': 'error', 'message': 'Draft not found.'}), 404

    return jsonify({
        'status': 'success',
        'data': {
            'approval': approval.to_dict(),
            'draft': draft.to_dict(),
            'is_valid_hash': (approval.content_hash == draft.content_hash)
        }
    })


@applications_bp.route('/review', methods=['POST'])
def submit_approval_decision():
    """
    Candidate grants or rejects approval for a pending application draft.
    """
    user = get_current_user_from_request()
    if not user:
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401

    data = request.get_json(silent=True) or {}
    token = data.get('approval_token')
    approved = bool(data.get('approved', False))
    rejection_reason = data.get('rejection_reason')

    if not token:
        return jsonify({'status': 'error', 'message': 'approval_token is required.'}), 400

    result = application_service.respond_to_approval(
        user_id=user.id,
        approval_token=token,
        approved=approved,
        rejection_reason=rejection_reason,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    return jsonify({'status': 'success', 'data': result})


@applications_bp.route('/<int:draft_id>/submit', methods=['POST'])
@limiter.limit("20 per minute")
def submit_application(draft_id):
    """
    Executes external submission. Requires a pre-granted approval token and idempotency key.
    """
    user = get_current_user_from_request()
    if not user:
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401

    data = request.get_json(silent=True) or {}
    token = data.get('approval_token')
    idempotency_key = data.get('idempotency_key')

    if not token or not idempotency_key:
        return jsonify({'status': 'error', 'message': 'Both approval_token and idempotency_key are required.'}), 400

    result = application_service.submit_application(
        user_id=user.id,
        draft_id=draft_id,
        approval_token=token,
        idempotency_key=idempotency_key,
        browser_service=browser_submission_service
    )
    return jsonify({'status': 'success', 'data': result})


@applications_bp.route('/submissions/<int:submission_id>', methods=['GET'])
def get_submission_status(submission_id):
    user = get_current_user_from_request()
    if not user:
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401

    result = application_service.get_submission_status(user.id, submission_id)
    return jsonify({'status': 'success', 'data': result})
