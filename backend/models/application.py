"""
models/application.py
---------------------
Models for Application Drafts, Versioning, User Approvals, Submission Attempts, and Audit Events.
Supports both SQLite and PostgreSQL.
"""
import hashlib
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple

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


def compute_application_hash(
    user_id: int,
    job_id: Optional[int],
    destination_url: str,
    answers: Dict[str, Any],
    resume_text: str,
    version: int = 1
) -> str:
    """
    Computes a deterministic SHA-256 cryptographic hash of application contents.
    Any modification to answers, destination, resume, or version alters the hash.
    """
    canonical_answers = json.dumps(answers or {}, sort_keys=True)
    payload = f"{user_id}|{job_id or ''}|{destination_url.strip()}|{canonical_answers}|{resume_text.strip()}|{version}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()


class ApplicationDraft(BaseModel):
    __tablename__ = 'application_drafts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id', ondelete='SET NULL'), nullable=True, index=True)

    target_role = db.Column(db.String(255), nullable=False)
    company_name = db.Column(db.String(255), nullable=False)
    destination_url = db.Column(db.String(1024), nullable=False)

    resume_version_id = db.Column(db.String(100), nullable=True)
    resume_text_snapshot = db.Column(db.Text, nullable=False)
    answers_json = db.Column(db.JSON, default=dict)
    declarations_json = db.Column(db.JSON, default=dict)

    # Workflow status: DRAFT, READY_FOR_REVIEW, APPROVED, SUBMITTING, SUBMITTED, REJECTED, EXPIRED, FAILED, SUBMISSION_UNKNOWN
    status = db.Column(db.String(50), default='DRAFT', index=True, nullable=False)
    content_hash = db.Column(db.String(64), nullable=False, index=True)
    version = db.Column(db.Integer, default=1, nullable=False)
    notes = db.Column(db.Text, nullable=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('application_drafts', lazy='dynamic', cascade='all, delete-orphan'))
    job = db.relationship('Job', backref=db.backref('application_drafts', lazy='dynamic'))
    approvals = db.relationship('ApplicationApproval', backref='draft', lazy='dynamic', cascade='all, delete-orphan')
    submissions = db.relationship('SubmissionAttempt', backref='draft', lazy='dynamic', cascade='all, delete-orphan')

    def update_content(
        self,
        answers: Optional[Dict[str, Any]] = None,
        resume_text: Optional[str] = None,
        destination_url: Optional[str] = None,
        target_role: Optional[str] = None,
        company_name: Optional[str] = None,
        declarations: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Updates content, increments version, and invalidates any previous approvals.
        """
        if answers is not None:
            self.answers_json = answers
        if resume_text is not None:
            self.resume_text_snapshot = resume_text
        if destination_url is not None:
            self.destination_url = destination_url
        if target_role is not None:
            self.target_role = target_role
        if company_name is not None:
            self.company_name = company_name
        if declarations is not None:
            self.declarations_json = declarations

        self.version += 1
        self.status = 'DRAFT'  # Content modified: resets status to DRAFT
        self.content_hash = compute_application_hash(
            user_id=self.user_id,
            job_id=self.job_id,
            destination_url=self.destination_url,
            answers=self.answers_json,
            resume_text=self.resume_text_snapshot,
            version=self.version
        )
        db.session.commit()

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'target_role': self.target_role,
            'company_name': self.company_name,
            'destination_url': self.destination_url,
            'resume_version_id': self.resume_version_id,
            'resume_text_snapshot': self.resume_text_snapshot,
            'answers': self.answers_json or {},
            'declarations': self.declarations_json or {},
            'status': self.status,
            'content_hash': self.content_hash,
            'version': self.version,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ApplicationApproval(BaseModel):
    __tablename__ = 'application_approvals'

    id = db.Column(db.Integer, primary_key=True)
    draft_id = db.Column(db.Integer, db.ForeignKey('application_drafts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    content_hash = db.Column(db.String(64), nullable=False)
    draft_version = db.Column(db.Integer, nullable=False)
    approval_token = db.Column(db.String(128), unique=True, nullable=False, index=True)

    # PENDING, APPROVED, REJECTED, EXPIRED, CONSUMED
    status = db.Column(db.String(50), default='PENDING', index=True, nullable=False)
    user_ip = db.Column(db.String(100), nullable=True)
    user_agent = db.Column(db.String(512), nullable=True)

    expires_at = db.Column(db.DateTime, nullable=False)
    approved_at = db.Column(db.DateTime, nullable=True)
    consumed_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)

    def is_valid_for_submission(self, current_draft: ApplicationDraft) -> Tuple[bool, str]:
        """
        Validates approval strictly: must be APPROVED, not expired, not consumed, and matching draft hash.
        """
        now = _now()
        if self.status == 'CONSUMED':
            return False, "Approval has already been consumed."
        if self.status == 'REJECTED':
            return False, "Approval was rejected by candidate."
        if self.status != 'APPROVED':
            return False, f"Approval is in state '{self.status}', awaiting explicit user consent."
        if self.expires_at and _to_naive_utc(self.expires_at) < now:
            return False, "Approval token has expired. A fresh approval is required."
        if self.content_hash != current_draft.content_hash:
            return False, "Draft content was altered after approval was granted. Previous approval invalidated."
        if self.draft_version != current_draft.version:
            return False, "Draft version mismatch. Approval is bound to an older revision."
        return True, "Approval valid"

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'draft_id': self.draft_id,
            'user_id': self.user_id,
            'status': self.status,
            'content_hash': self.content_hash,
            'draft_version': self.draft_version,
            'approval_token': self.approval_token,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'consumed_at': self.consumed_at.isoformat() if self.consumed_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SubmissionAttempt(BaseModel):
    __tablename__ = 'submission_attempts'
    __table_args__ = (
        db.UniqueConstraint('idempotency_key', name='uq_submission_idempotency'),
    )

    id = db.Column(db.Integer, primary_key=True)
    draft_id = db.Column(db.Integer, db.ForeignKey('application_drafts.id', ondelete='CASCADE'), nullable=False, index=True)
    approval_id = db.Column(db.Integer, db.ForeignKey('application_approvals.id', ondelete='SET NULL'), nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    idempotency_key = db.Column(db.String(128), nullable=False, unique=True, index=True)
    destination_url = db.Column(db.String(1024), nullable=False)
    submission_channel = db.Column(db.String(50), default='browser_playwright')  # 'browser_playwright', 'api', 'email'

    # SUBMITTING, SUBMITTED, FAILED, SUBMISSION_UNKNOWN
    status = db.Column(db.String(50), default='SUBMITTING', index=True, nullable=False)
    external_receipt = db.Column(db.Text, nullable=True)  # confirmation id, response body, or receipt payload
    error_message = db.Column(db.Text, nullable=True)

    attempted_at = db.Column(db.DateTime, default=_now, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'draft_id': self.draft_id,
            'approval_id': self.approval_id,
            'user_id': self.user_id,
            'idempotency_key': self.idempotency_key,
            'destination_url': self.destination_url,
            'submission_channel': self.submission_channel,
            'status': self.status,
            'external_receipt': self.external_receipt,
            'error_message': self.error_message,
            'attempted_at': self.attempted_at.isoformat() if self.attempted_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }


class AuditEvent(BaseModel):
    __tablename__ = 'audit_events'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    event_type = db.Column(db.String(100), nullable=False, index=True)  # 'mcp_tool_call', 'draft_created', 'approval_granted', etc.
    entity_type = db.Column(db.String(100), nullable=False)  # 'draft', 'approval', 'submission', 'oauth'
    entity_id = db.Column(db.String(100), nullable=True)
    payload_json = db.Column(db.JSON, default=dict)
    ip_address = db.Column(db.String(100), nullable=True)

    @classmethod
    def log(
        cls,
        event_type: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        user_id: Optional[int] = None,
        payload: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> 'AuditEvent':
        event = cls(
            user_id=user_id,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            payload_json=payload or {},
            ip_address=ip_address
        )
        db.session.add(event)
        db.session.commit()
        return event

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'payload': self.payload_json or {},
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
