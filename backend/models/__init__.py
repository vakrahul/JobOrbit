# models package — imports all models for Flask-Migrate to discover them
from models.base import db, TimestampMixin, SoftDeleteMixin, BaseModel
from models.job import Job, generate_job_dedupe_key
from models.user import User, SavedJob
from models.hr import HRContact, generate_hr_dedupe_key
from models.research import ProfessorContact
from models.prep import PrepQuestion
from models.audit import ScrapeLog
from models.application import (
    ApplicationDraft,
    ApplicationApproval,
    SubmissionAttempt,
    AuditEvent,
    compute_application_hash,
)
from models.oauth import (
    OAuthClient,
    OAuthAuthorizationCode,
    OAuthToken,
)

__all__ = [
    "db",
    "TimestampMixin",
    "SoftDeleteMixin",
    "BaseModel",
    "Job",
    "generate_job_dedupe_key",
    "User",
    "SavedJob",
    "HRContact",
    "generate_hr_dedupe_key",
    "ProfessorContact",
    "PrepQuestion",
    "ScrapeLog",
    "ApplicationDraft",
    "ApplicationApproval",
    "SubmissionAttempt",
    "AuditEvent",
    "compute_application_hash",
    "OAuthClient",
    "OAuthAuthorizationCode",
    "OAuthToken",
]

