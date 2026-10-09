"""
routes/ai.py
------------
Thin controller layer for AI services (Resume Matcher, Fit Check, Cold Email Drafter).
All business logic is encapsulated in services/ai_service.py.
"""
from flask import Blueprint, jsonify, request
from marshmallow import ValidationError as MarshmallowValidationError

from core.extensions import limiter
from core.config import settings
from core.exceptions import AppError
from services.ai_service import ai_service
from schemas.job_schemas import resume_match_schema, fit_check_schema, draft_email_schema

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')


@ai_bp.route('/match-resume', methods=['POST'])
@limiter.limit(settings.RATE_LIMIT_AI)
def match_resume():
    """
    POST /api/ai/match-resume
    Body: { resume_text, target, limit }
    Rate limited: 20/min
    """
    try:
        data = resume_match_schema.load(request.get_json(silent=True) or {})
    except MarshmallowValidationError as e:
        return jsonify({'status': 'error', 'error_code': 'VALIDATION_ERROR', 'errors': e.messages}), 400

    try:
        result = ai_service.match_resume(
            resume_text=data['resume_text'],
            target=data.get('target', 'jobs'),
            limit=data.get('limit', 12)
        )
        return jsonify(result)
    except AppError as e:
        return jsonify(e.to_dict()), e.status_code


@ai_bp.route('/fit-check', methods=['POST'])
@limiter.limit("30 per minute")
def fit_check():
    """
    POST /api/ai/fit-check
    Body: { resume_text, target_type, target_id }
    Rate limited: 30/min
    """
    try:
        data = fit_check_schema.load(request.get_json(silent=True) or {})
    except MarshmallowValidationError as e:
        return jsonify({'status': 'error', 'error_code': 'VALIDATION_ERROR', 'errors': e.messages}), 400

    try:
        result = ai_service.fit_check(
            resume_text=data['resume_text'],
            target_type=data['target_type'],
            target_id=data['target_id']
        )
        return jsonify(result)
    except AppError as e:
        return jsonify(e.to_dict()), e.status_code


@ai_bp.route('/draft-email', methods=['POST'])
@limiter.limit("30 per minute")
def draft_email():
    """
    POST /api/ai/draft-email
    Body: { target_type, target_id, resume_summary?, tone? }
    Rate limited: 30/min
    """
    try:
        data = draft_email_schema.load(request.get_json(silent=True) or {})
    except MarshmallowValidationError as e:
        return jsonify({'status': 'error', 'error_code': 'VALIDATION_ERROR', 'errors': e.messages}), 400

    try:
        result = ai_service.draft_email(
            target_type=data['target_type'],
            target_id=data['target_id'],
            resume_summary=data.get('resume_summary', ''),
            tone=data.get('tone', 'formal')
        )
        return jsonify(result)
    except AppError as e:
        return jsonify(e.to_dict()), e.status_code


@ai_bp.route('/audit-agent', methods=['POST'])
@limiter.limit("30 per minute")
def audit_agent():
    """
    POST /api/ai/audit-agent
    Body: { resume_text, target_role?, custom_skills? }
    Deep autonomous skill audit powered by Google Gemini 2.5 Flash.
    """
    payload = request.get_json(silent=True) or {}
    resume_text = (payload.get('resume_text') or '').strip()
    if not resume_text or len(resume_text) < 25:
        return jsonify({'status': 'error', 'message': 'Please provide resume or profile text of at least 25 characters.'}), 400

    target_role = (payload.get('target_role') or 'Autonomous AI & Systems Engineer').strip()
    custom_skills = payload.get('custom_skills') or []

    result = ai_service.audit_skills_with_agent(
        resume_text=resume_text,
        target_role=target_role,
        custom_skills=custom_skills
    )
    return jsonify(result)

