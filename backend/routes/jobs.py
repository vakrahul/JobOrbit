"""
routes/jobs.py
--------------
Thin controller layer — validates input, calls services, returns JSON.
All business logic is in services/job_service.py.
All DB access is in repositories/job_repository.py.
"""
from flask import Blueprint, jsonify, request
from marshmallow import ValidationError as MarshmallowValidationError

from core.extensions import cache, limiter
from core.config import settings
from core.exceptions import AppError
from services.job_service import job_service
from schemas.job_schemas import job_search_schema, job_application_schema

jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')


@jobs_bp.route('', methods=['GET'])
@limiter.limit(settings.RATE_LIMIT_SEARCH)
def list_jobs():
    """
    GET /api/jobs
    Query params: q, region, type, batch, remote, new_today, page, limit
    Rate limited: 60/min
    """
    try:
        filters = job_search_schema.load(request.args)
    except MarshmallowValidationError as e:
        return jsonify({'status': 'error', 'error_code': 'VALIDATION_ERROR', 'errors': e.messages}), 400

    try:
        result = job_service.search(filters)
        return jsonify(result)
    except AppError as e:
        return jsonify(e.to_dict()), e.status_code


@jobs_bp.route('/<int:job_id>', methods=['GET'])
@limiter.limit(settings.RATE_LIMIT_JOB_DETAIL)
@cache.cached(timeout=settings.CACHE_TTL_JOB_DETAIL, key_prefix=lambda: f"job_detail_{request.view_args.get('job_id')}")
def get_job(job_id: int):
    """
    GET /api/jobs/<id>
    Auto-enriches thin descriptions.
    Rate limited: 120/min. Cached 5 min.
    """
    try:
        job_dict = job_service.get_detail(job_id)
        return jsonify({'status': 'success', 'job': job_dict})
    except AppError as e:
        return jsonify(e.to_dict()), e.status_code


@jobs_bp.route('/<int:job_id>/apply', methods=['POST'])
@limiter.limit("30 per minute")
def apply_to_job(job_id: int):
    """
    POST /api/jobs/<id>/apply
    Body: { name, email, resume_link?, cover_note? }
    Rate limited: 30/min
    """
    try:
        data = job_application_schema.load(request.get_json(silent=True) or {})
    except MarshmallowValidationError as e:
        return jsonify({'status': 'error', 'error_code': 'VALIDATION_ERROR', 'errors': e.messages}), 400

    try:
        result = job_service.submit_application(job_id, data)
        return jsonify(result)
    except AppError as e:
        return jsonify(e.to_dict()), e.status_code


@jobs_bp.route('/filters', methods=['GET'])
@limiter.limit("120 per minute")
@cache.cached(timeout=settings.CACHE_TTL_FILTERS, key_prefix='job_filters')
def get_filter_options():
    """
    GET /api/jobs/filters
    Cached 30 min — filter options rarely change.
    """
    return jsonify(job_service.get_filter_options())
