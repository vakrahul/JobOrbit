"""
tests/test_application_workflow.py
-----------------------------------
Automated unit & integration tests for Application State Machine:
- Hash binding integrity
- Human approval requirement
- Invalidation upon draft modification
- Cross-user security checks
- Idempotency & duplicate submission prevention
- Single-use approval consumption
"""
import pytest
from datetime import datetime, timezone, timedelta
from app import create_app
from core.extensions import db
from models.user import User
from models.job import Job
from models.application import ApplicationDraft, ApplicationApproval, SubmissionAttempt
from services.application_service import application_service
from core.exceptions import ValidationError, UnauthorizedError


@pytest.fixture
def app_and_ctx():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'RATELIMIT_ENABLED': False
    })
    with app.app_context():
        db.create_all()
        # Seed test user A and user B
        user_a = User(email="candidate_a@joborbit.live", name="Candidate A")
        user_b = User(email="candidate_b@joborbit.live", name="Candidate B")
        job = Job(
            title="Senior AI Engineer",
            company="DeepMind",
            location="Bengaluru",
            apply_url="https://forms.gle/test-job-apply",
            source="manual",
            dedupe_key="deepmind_ai_test"
        )
        db.session.add_all([user_a, user_b, job])
        db.session.commit()
        yield app, user_a, user_b, job
        db.session.remove()
        db.drop_all()


def test_draft_creation_and_hash_binding(app_and_ctx):
    app, user_a, user_b, job = app_and_ctx
    
    draft = application_service.create_draft(
        user_id=user_a.id,
        target_role="Senior AI Engineer",
        company_name="DeepMind",
        destination_url="https://forms.gle/test-job-apply",
        resume_text="Experienced in Python, LLMs, and distributed systems at Scale AI.",
        job_id=job.id,
        answers={"why_us": "Excited about autonomous agents"},
        declarations={"authorized_to_work": True}
    )

    assert draft.id is not None
    assert draft.status == "DRAFT"
    assert draft.version == 1
    assert len(draft.content_hash) == 64  # SHA-256


def test_modification_invalidates_previous_approval(app_and_ctx):
    app, user_a, user_b, job = app_and_ctx

    # 1. Create draft
    draft = application_service.create_draft(
        user_id=user_a.id,
        target_role="Senior AI Engineer",
        company_name="DeepMind",
        destination_url="https://forms.gle/test-job-apply",
        resume_text="Original resume facts.",
        answers={"years_exp": "4"}
    )
    initial_hash = draft.content_hash

    # 2. Request approval
    approval_req = application_service.request_approval(user_a.id, draft.id)
    token = approval_req['approval_token']
    assert approval_req['status'] == 'PENDING_APPROVAL'

    # Candidate approves
    application_service.respond_to_approval(user_a.id, token, approved=True)
    reloaded_approval = ApplicationApproval.query.filter_by(approval_token=token).first()
    assert reloaded_approval.status == "APPROVED"

    # 3. Modify draft answers after approval was granted
    application_service.update_draft(
        user_id=user_a.id,
        draft_id=draft.id,
        answers={"years_exp": "5"}  # Changed years of experience
    )
    reloaded_draft = db.session.get(ApplicationDraft, draft.id)
    assert reloaded_draft.status == "DRAFT"
    assert reloaded_draft.content_hash != initial_hash
    assert reloaded_draft.version == 2

    # Previous approval must now be invalidated / EXPIRED
    db.session.refresh(reloaded_approval)
    assert reloaded_approval.status == "EXPIRED"

    # Attempting to submit with old approval must be blocked!
    with pytest.raises(ValidationError) as exc:
        application_service.submit_application(
            user_id=user_a.id,
            draft_id=draft.id,
            approval_token=token,
            idempotency_key="unique_attempt_key_001"
        )
    assert "rejected" in str(exc.value).lower()


def test_cross_user_access_blocked(app_and_ctx):
    app, user_a, user_b, job = app_and_ctx

    draft_a = application_service.create_draft(
        user_id=user_a.id,
        target_role="SDE",
        company_name="Google",
        destination_url="https://forms.gle/google-sde",
        resume_text="User A resume facts."
    )

    # User B cannot access User A's draft
    with pytest.raises(UnauthorizedError):
        application_service.get_draft(user_id=user_b.id, draft_id=draft_a.id)

    # User B cannot update User A's draft
    with pytest.raises(UnauthorizedError):
        application_service.update_draft(user_id=user_b.id, draft_id=draft_a.id, answers={"q": "hack"})


def test_single_use_approval_consumption_and_idempotency(app_and_ctx):
    app, user_a, user_b, job = app_and_ctx

    draft = application_service.create_draft(
        user_id=user_a.id,
        target_role="Full Stack Dev",
        company_name="Razorpay",
        destination_url="https://forms.gle/rzp-apply",
        resume_text="Proficient in Python and React."
    )

    # Request and grant approval
    approval_req = application_service.request_approval(user_a.id, draft.id)
    token = approval_req['approval_token']
    application_service.respond_to_approval(user_a.id, token, approved=True)

    # 1. First submission succeeds
    idempotency_key = "idemp_unique_key_12345"
    res1 = application_service.submit_application(
        user_id=user_a.id,
        draft_id=draft.id,
        approval_token=token,
        idempotency_key=idempotency_key
    )
    assert res1['status'] == 'SUBMITTED'

    # Approval is now CONSUMED
    approval_record = ApplicationApproval.query.filter_by(approval_token=token).first()
    assert approval_record.status == 'CONSUMED'

    # 2. Resubmitting with same idempotency key returns existing attempt without duplicate call
    res2 = application_service.submit_application(
        user_id=user_a.id,
        draft_id=draft.id,
        approval_token=token,
        idempotency_key=idempotency_key
    )
    assert res2['id'] == res1['id']

    # 3. Resubmitting with a new idempotency key fails because approval was consumed!
    with pytest.raises(ValidationError) as exc:
        application_service.submit_application(
            user_id=user_a.id,
            draft_id=draft.id,
            approval_token=token,
            idempotency_key="idemp_another_attempt_67890"
        )
    assert "already been consumed" in str(exc.value)
