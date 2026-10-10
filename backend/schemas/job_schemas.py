"""
schemas/job_schemas.py
-----------------------
Marshmallow schemas for job-related request/response validation.
All incoming query params and POST bodies are validated here
before reaching service or repository layer.
"""
from marshmallow import Schema, fields, validate, validates, ValidationError, post_load, EXCLUDE


class JobSearchSchema(Schema):
    """Validates GET /api/jobs query parameters."""
    class Meta:
        unknown = EXCLUDE   # ignore unknown query params silently

    q = fields.Str(load_default='', validate=validate.Length(max=200))
    region = fields.Str(load_default='all')
    type = fields.Str(load_default='all', data_key='type')
    batch = fields.Str(load_default='all')
    location = fields.Str(load_default='')
    remote = fields.Bool(load_default=False)
    new_today = fields.Bool(load_default=False)
    vip_only = fields.Bool(load_default=False)
    page = fields.Int(load_default=1, validate=validate.Range(min=1, max=1000))
    limit = fields.Int(load_default=24, validate=validate.Range(min=1, max=100))

    @validates('q')
    def validate_q(self, value, **kwargs):
        # Block SQL injection patterns
        bad = ["'", '"', ';', '--', 'DROP', 'SELECT', 'INSERT', 'DELETE']
        if any(b.lower() in value.lower() for b in bad):
            raise ValidationError("Search query contains invalid characters.")


class JobApplicationSchema(Schema):
    """Validates POST /api/jobs/<id>/apply body."""
    class Meta:
        unknown = EXCLUDE

    name = fields.Str(required=True, validate=validate.Length(min=2, max=200))
    email = fields.Email(required=True)
    resume_link = fields.Url(load_default=None, allow_none=True)
    cover_note = fields.Str(load_default='', validate=validate.Length(max=5000))


class ResumeMatchSchema(Schema):
    """Validates POST /api/ai/match-resume body."""
    class Meta:
        unknown = EXCLUDE

    resume_text = fields.Str(
        required=True,
        validate=validate.Length(min=50, max=30000,
            error="Resume must be between 50 and 30,000 characters.")
    )
    target = fields.Str(
        load_default='jobs',
        validate=validate.OneOf(['jobs', 'research', 'hr'],
            error="target must be one of: jobs, research, hr")
    )
    limit = fields.Int(load_default=12, validate=validate.Range(min=1, max=30))


class FitCheckSchema(Schema):
    """Validates POST /api/ai/fit-check body."""
    class Meta:
        unknown = EXCLUDE

    resume_text = fields.Str(
        required=True,
        validate=validate.Length(min=50, max=30000)
    )
    job_id = fields.Int(load_default=None, allow_none=True)
    prof_id = fields.Int(load_default=None, allow_none=True)

    @validates('job_id')
    def validate_ids(self, value, **kwargs):
        pass  # at least one of job_id or prof_id checked at service layer


class DraftEmailSchema(Schema):
    """Validates POST /api/ai/draft-email body."""
    class Meta:
        unknown = EXCLUDE

    kind = fields.Str(
        load_default='job',
        validate=validate.OneOf(['job', 'professor', 'hr'])
    )
    target_id = fields.Int(required=True, validate=validate.Range(min=1))
    candidate_name = fields.Str(load_default='Applicant', validate=validate.Length(max=200))
    candidate_background = fields.Str(load_default='Software Engineering', validate=validate.Length(max=500))
    tone = fields.Str(load_default='professional', validate=validate.OneOf(['professional', 'casual', 'enthusiastic']))


class AdminSyncSchema(Schema):
    """Validates POST /api/admin/sync body."""
    class Meta:
        unknown = EXCLUDE

    target = fields.Str(
        load_default='all',
        validate=validate.OneOf(['india', 'global', 'wellfound', 'all', 'quick', 'hr'])
    )
    mode = fields.Str(
        load_default='incremental',
        validate=validate.OneOf(['incremental', 'full'])
    )
    pages = fields.Int(load_default=None, allow_none=True, validate=validate.Range(min=1, max=500))


# ── Schema singletons (reuse to avoid re-instantiation cost) ─────────────────
job_search_schema = JobSearchSchema()
job_application_schema = JobApplicationSchema()
resume_match_schema = ResumeMatchSchema()
fit_check_schema = FitCheckSchema()
draft_email_schema = DraftEmailSchema()
admin_sync_schema = AdminSyncSchema()
