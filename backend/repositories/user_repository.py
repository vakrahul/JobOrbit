"""
repositories/user_repository.py
-------------------------------
OOP Data access layer for User and SavedJob (Application Pipeline Tracker).
"""
from typing import Optional, List
from datetime import datetime, timezone
from models.user import User, SavedJob
from models.job import Job
from core.extensions import db


class UserRepository:
    def get_by_id(self, user_id: int) -> Optional[User]:
        return User.query.get(user_id)

    def get_by_email(self, email: str) -> Optional[User]:
        return User.query.filter_by(email=email.strip().lower()).first()

    def get_default_or_create(self, email: str = 'candidate@joborbit.app', name: str = 'Candidate') -> User:
        user = User.query.first()
        if not user:
            user = User(
                email=email,
                name=name,
                role='user',
                is_premium=True,
                premium_tier='lifetime'
            )
            db.session.add(user)
            db.session.commit()
        return user

    def create_user_with_password(self, email: str, name: str, password: str) -> User:
        from werkzeug.security import generate_password_hash
        user = self.get_by_email(email)
        if user:
            raise ValueError("An account with this email address already exists.")
        
        user = User(
            email=email.strip().lower(),
            name=name.strip() if name else email.split('@')[0],
            password_hash=generate_password_hash(password),
            avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={email}",
            is_premium=False,
            premium_tier='free',
            role='user'
        )
        db.session.add(user)
        db.session.commit()
        return user

    def verify_password(self, user: User, password: str) -> bool:
        from werkzeug.security import check_password_hash
        if not user or not user.password_hash:
            return False
        return check_password_hash(user.password_hash, password)

    def set_user_password(self, user: User, password: str) -> None:
        from werkzeug.security import generate_password_hash
        user.password_hash = generate_password_hash(password)
        db.session.commit()

    def create_or_update_google_user(self, email: str, name: str, avatar_url: str) -> User:
        user = self.get_by_email(email)
        if not user:
            user = User(
                email=email.strip().lower(),
                name=name.strip(),
                avatar_url=avatar_url,
                is_premium=True,  # Default demo access
                premium_tier='lifetime',
                role='admin'
            )
            db.session.add(user)
        else:
            if name:
                user.name = name.strip()
            if avatar_url:
                user.avatar_url = avatar_url
        db.session.commit()
        return user

    def set_premium(self, user_id: int, tier: str = 'lifetime') -> Optional[User]:
        user = self.get_by_id(user_id)
        if user:
            user.is_premium = True
            user.premium_tier = tier
            user.premium_since = datetime.now(timezone.utc)
            db.session.commit()
        return user

    # ── Application Tracker (SavedJob) ──────────────────────────────────────────

    def get_user_saved_jobs(self, user_id: int, status: Optional[str] = None) -> List[SavedJob]:
        query = SavedJob.query.filter_by(user_id=user_id)
        if status and status.lower() != 'all':
            query = query.filter_by(status=status.lower())
        return query.order_by(SavedJob.updated_at.desc()).all()

    def get_saved_job(self, user_id: int, job_id: int) -> Optional[SavedJob]:
        return SavedJob.query.filter_by(user_id=user_id, job_id=job_id).first()

    def save_or_update_pipeline(
        self,
        user_id: int,
        job_id: int,
        status: str = 'saved',
        notes: str = ''
    ) -> tuple[SavedJob, bool]:
        """
        Save or update job pipeline status. Returns (SavedJob, is_new).
        """
        existing = self.get_saved_job(user_id, job_id)
        if existing:
            existing.status = status
            if notes:
                existing.notes = notes
            db.session.commit()
            return existing, False

        saved = SavedJob(
            user_id=user_id,
            job_id=job_id,
            status=status,
            notes=notes or ''
        )
        db.session.add(saved)
        db.session.commit()
        return saved, True

    def get_total_count(self) -> int:
        return User.query.count()

    def get_premium_count(self) -> int:
        return User.query.filter_by(is_premium=True).count()


user_repo = UserRepository()

