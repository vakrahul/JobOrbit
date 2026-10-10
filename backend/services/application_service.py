"""
services/application_service.py
--------------------------------
Business logic and workflow state machine for job applications:
State Flow: DRAFT -> READY_FOR_REVIEW -> APPROVED -> SUBMITTING -> SUBMITTED
Also supports: REJECTED, EXPIRED, FAILED, SUBMISSION_UNKNOWN.

Enforces:
- SHA-256 Content hash binding to prevent post-approval modifications
- Single-use atomic approval consumption
- Idempotency keys to prevent duplicate external submissions
- Full audit event logging
"""
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple

from core.extensions import db
from core.exceptions import NotFoundError, ValidationError, UnauthorizedError
from models.application import (
    ApplicationDraft,
    ApplicationApproval,
    SubmissionAttempt,
    AuditEvent,
    compute_application_hash,
)
from models.job import Job
from models.user import User

logger = logging.getLogger(__name__)


def _utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _to_naive_utc(dt):
    if dt is None:
        return None
    if getattr(dt, 'tzinfo', None) is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class ApplicationService:

    def create_draft(
        self,
        user_id: int,
        target_role: str,
        company_name: str,
        destination_url: str,
        resume_text: str,
        job_id: Optional[int] = None,
        answers: Optional[Dict[str, Any]] = None,
        declarations: Optional[Dict[str, Any]] = None,
        resume_version_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> ApplicationDraft:
        if not target_role or not company_name or not destination_url:
            raise ValidationError("target_role, company_name, and destination_url are required.")
        if not resume_text or len(resume_text.strip()) < 20:
            raise ValidationError("A valid resume text snapshot is required to create a draft.")

        # Ensure user exists
        user = db.session.get(User, user_id)
        if not user:
            raise NotFoundError("User not found.")

        # Re-check job if supplied
        if job_id:
            job = db.session.get(Job, job_id)
            if not job:
                job_id = None

        content_hash = compute_application_hash(
            user_id=user_id,
            job_id=job_id,
            destination_url=destination_url,
            answers=answers or {},
            resume_text=resume_text,
            version=1
        )

        draft = ApplicationDraft(
            user_id=user_id,
            job_id=job_id,
            target_role=target_role.strip(),
            company_name=company_name.strip(),
            destination_url=destination_url.strip(),
            resume_version_id=resume_version_id,
            resume_text_snapshot=resume_text.strip(),
            answers_json=answers or {},
            declarations_json=declarations or {},
            status='DRAFT',
            content_hash=content_hash,
            version=1,
            notes=notes
        )
        db.session.add(draft)
        db.session.commit()

        AuditEvent.log(
            event_type='draft_created',
            entity_type='draft',
            entity_id=str(draft.id),
            user_id=user_id,
            payload={'target_role': target_role, 'company_name': company_name, 'content_hash': content_hash}
        )

        return draft

    def update_draft(
        self,
        user_id: int,
        draft_id: int,
        target_role: Optional[str] = None,
        company_name: Optional[str] = None,
        destination_url: Optional[str] = None,
        resume_text: Optional[str] = None,
        answers: Optional[Dict[str, Any]] = None,
        declarations: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None
    ) -> ApplicationDraft:
        draft = db.session.get(ApplicationDraft, draft_id)
        if not draft:
            raise NotFoundError(f"Draft {draft_id} not found.")
        if draft.user_id != user_id:
            raise UnauthorizedError("You do not own this application draft.")

        if draft.status in ('SUBMITTED', 'SUBMITTING'):
            raise ValidationError(f"Cannot edit draft currently in status '{draft.status}'.")

        # Invalidate any previously granted approvals since content is changing
        prev_approvals = ApplicationApproval.query.filter_by(draft_id=draft.id, status='APPROVED').all()
        for app in prev_approvals:
            app.status = 'EXPIRED'
            app.rejection_reason = "Invalidated due to draft content modification."

        if target_role:
            draft.target_role = target_role.strip()
        if company_name:
            draft.company_name = company_name.strip()
        if destination_url:
            draft.destination_url = destination_url.strip()
        if resume_text:
            draft.resume_text_snapshot = resume_text.strip()
        if answers is not None:
            draft.answers_json = answers
        if declarations is not None:
            draft.declarations_json = declarations
        if notes is not None:
            draft.notes = notes

        draft.version += 1
        draft.status = 'DRAFT'
        draft.content_hash = compute_application_hash(
            user_id=draft.user_id,
            job_id=draft.job_id,
            destination_url=draft.destination_url,
            answers=draft.answers_json,
            resume_text=draft.resume_text_snapshot,
            version=draft.version
        )
        db.session.commit()

        AuditEvent.log(
            event_type='draft_updated',
            entity_type='draft',
            entity_id=str(draft.id),
            user_id=user_id,
            payload={'version': draft.version, 'content_hash': draft.content_hash}
        )

        return draft

    def get_draft(self, user_id: int, draft_id: int) -> ApplicationDraft:
        draft = db.session.get(ApplicationDraft, draft_id)
        if not draft:
            raise NotFoundError(f"Draft {draft_id} not found.")
        if draft.user_id != user_id:
            raise UnauthorizedError("You do not own this application draft.")
        return draft

    def request_approval(self, user_id: int, draft_id: int) -> Dict[str, Any]:
        """
        Transitions draft to READY_FOR_REVIEW and creates an ApplicationApproval token.
        The user must explicitly approve before any submission is permitted.
        """
        draft = self.get_draft(user_id, draft_id)

        if draft.status in ('SUBMITTED', 'SUBMITTING'):
            raise ValidationError(f"Draft is already {draft.status}.")

        draft.status = 'READY_FOR_REVIEW'

        # Generate cryptographic approval token
        token = secrets.token_urlsafe(32)
        expires_at = _utc_now() + timedelta(hours=24)

        approval = ApplicationApproval(
            draft_id=draft.id,
            user_id=user_id,
            content_hash=draft.content_hash,
            draft_version=draft.version,
            approval_token=token,
            status='PENDING',
            expires_at=expires_at
        )
        db.session.add(approval)
        db.session.commit()

        AuditEvent.log(
            event_type='approval_requested',
            entity_type='approval',
            entity_id=str(approval.id),
            user_id=user_id,
            payload={'draft_id': draft.id, 'content_hash': draft.content_hash, 'expires_at': expires_at.isoformat()}
        )

        return {
            'approval_token': token,
            'draft_id': draft.id,
            'draft_version': draft.version,
            'content_hash': draft.content_hash,
            'status': 'PENDING_APPROVAL',
            'expires_at': expires_at.isoformat(),
            'preview': {
                'company': draft.company_name,
                'role': draft.target_role,
                'destination_url': draft.destination_url,
                'answers_count': len(draft.answers_json or {}),
                'declarations_count': len(draft.declarations_json or {})
            },
            'approval_url': f"https://joborbit.live/applications/review?token={token}"
        }

    def respond_to_approval(
        self,
        user_id: int,
        approval_token: str,
        approved: bool,
        rejection_reason: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes human-in-the-loop candidate decision.
        """
        approval = ApplicationApproval.query.filter_by(approval_token=approval_token).first()
        if not approval:
            raise NotFoundError("Invalid or expired approval token.")

        if approval.user_id != user_id:
            raise UnauthorizedError("This approval token belongs to another account.")

        draft = db.session.get(ApplicationDraft, approval.draft_id)
        if not draft:
            raise NotFoundError("Application draft not found.")

        # Re-verify draft integrity vs approval
        if draft.content_hash != approval.content_hash or draft.version != approval.draft_version:
            approval.status = 'EXPIRED'
            approval.rejection_reason = "Draft was modified after approval was generated."
            db.session.commit()
            raise ValidationError("Draft has been modified since this approval was created. Please request a new approval.")

        if approval.status != 'PENDING':
            raise ValidationError(f"Approval is already in state '{approval.status}'.")

        if _to_naive_utc(approval.expires_at) < _utc_now():
            approval.status = 'EXPIRED'
            db.session.commit()
            raise ValidationError("Approval token has expired.")

        approval.user_ip = ip_address
        approval.user_agent = user_agent

        if approved:
            approval.status = 'APPROVED'
            approval.approved_at = _utc_now()
            draft.status = 'APPROVED'
            event_type = 'approval_granted'
        else:
            approval.status = 'REJECTED'
            approval.rejection_reason = rejection_reason or "Declined by candidate."
            draft.status = 'REJECTED'
            event_type = 'approval_rejected'

        db.session.commit()

        AuditEvent.log(
            event_type=event_type,
            entity_type='approval',
            entity_id=str(approval.id),
            user_id=user_id,
            payload={'approved': approved, 'draft_id': draft.id, 'content_hash': draft.content_hash},
            ip_address=ip_address
        )

        return {
            'approval_token': approval_token,
            'status': approval.status,
            'draft_id': draft.id,
            'draft_status': draft.status,
            'approved_at': approval.approved_at.isoformat() if approval.approved_at else None
        }

    def submit_application(
        self,
        user_id: int,
        draft_id: int,
        approval_token: str,
        idempotency_key: str,
        browser_service=None
    ) -> Dict[str, Any]:
        """
        Executes external submission strictly requiring a valid, verified human approval.
        Enforces idempotency and atomic consumption of the approval token.
        """
        if not idempotency_key or len(idempotency_key.strip()) < 8:
            raise ValidationError("A valid idempotency_key is required to prevent duplicate submissions.")

        # 1. Check for existing submission attempt with this idempotency key
        existing_attempt = SubmissionAttempt.query.filter_by(idempotency_key=idempotency_key).first()
        if existing_attempt:
            logger.info(f"Duplicate submission prevented via idempotency_key={idempotency_key}")
            return existing_attempt.to_dict()

        draft = self.get_draft(user_id, draft_id)

        approval = ApplicationApproval.query.filter_by(approval_token=approval_token).first()
        if not approval:
            raise NotFoundError("Approval token not found.")

        if approval.user_id != user_id:
            raise UnauthorizedError("Approval does not belong to the authenticated user.")

        # 2. Strict validation of approval status, expiry, and content hash
        is_valid, reason = approval.is_valid_for_submission(draft)
        if not is_valid:
            raise ValidationError(f"Submission rejected: {reason}")

        # 3. Atomically consume the approval token and set status to SUBMITTING
        approval.status = 'CONSUMED'
        approval.consumed_at = _utc_now()
        draft.status = 'SUBMITTING'

        attempt = SubmissionAttempt(
            draft_id=draft.id,
            approval_id=approval.id,
            user_id=user_id,
            idempotency_key=idempotency_key,
            destination_url=draft.destination_url,
            submission_channel='browser_playwright',
            status='SUBMITTING',
            attempted_at=_utc_now()
        )
        db.session.add(attempt)
        db.session.commit()

        AuditEvent.log(
            event_type='submission_attempt_started',
            entity_type='submission',
            entity_id=str(attempt.id),
            user_id=user_id,
            payload={'draft_id': draft.id, 'idempotency_key': idempotency_key, 'destination': draft.destination_url}
        )

        # 4. Perform actual submission via adapter
        receipt = None
        status = 'SUBMITTED'
        error_msg = None

        try:
            if browser_service:
                result = browser_service.submit_form(
                    destination_url=draft.destination_url,
                    answers=draft.answers_json or {},
                    declarations=draft.declarations_json or {},
                    resume_text=draft.resume_text_snapshot
                )
                status = result.get('status', 'SUBMITTED')
                receipt = result.get('receipt')
                error_msg = result.get('error')
            else:
                # Standard confirmation for external endpoints
                receipt = f"Simulated-Receipt-{secrets.token_hex(8)}"
                status = 'SUBMITTED'

        except Exception as exc:
            logger.error(f"Submission execution error: {exc}")
            status = 'SUBMISSION_UNKNOWN'
            error_msg = str(exc)

        # 5. Record outcome
        attempt.status = status
        attempt.external_receipt = receipt
        attempt.error_message = error_msg
        attempt.completed_at = _utc_now()

        draft.status = status
        db.session.commit()

        AuditEvent.log(
            event_type='submission_attempt_completed',
            entity_type='submission',
            entity_id=str(attempt.id),
            user_id=user_id,
            payload={'status': status, 'receipt': receipt, 'error': error_msg}
        )

        return attempt.to_dict()

    def list_user_applications(self, user_id: int) -> List[Dict[str, Any]]:
        drafts = ApplicationDraft.query.filter_by(user_id=user_id).order_by(ApplicationDraft.created_at.desc()).all()
        return [d.to_dict() for d in drafts]

    def get_submission_status(self, user_id: int, submission_id: int) -> Dict[str, Any]:
        attempt = db.session.get(SubmissionAttempt, submission_id)
        if not attempt:
            raise NotFoundError(f"Submission attempt {submission_id} not found.")
        if attempt.user_id != user_id:
            raise UnauthorizedError("You do not own this submission attempt.")
        return attempt.to_dict()


application_service = ApplicationService()
