"""
models/user.py — User + SavedJob models
"""
from datetime import datetime, timezone
from core.extensions import db
from models.base import BaseModel


class User(BaseModel):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255))
    avatar_url = db.Column(db.String(1024))
    password_hash = db.Column(db.String(255), nullable=True)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    is_premium = db.Column(db.Boolean, default=False)
    premium_since = db.Column(db.DateTime, nullable=True)
    premium_tier = db.Column(db.String(20), default='free')  # 'free', 'monthly', 'lifetime'
    razorpay_payment_id = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(50), default='user')  # 'user', 'admin'

    saved_jobs = db.relationship('SavedJob', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    @property
    def full_name(self) -> str:
        return self.name or ''

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'is_premium': self.is_premium,
            'premium_tier': self.premium_tier,
            'premium_since': self.premium_since.isoformat() if self.premium_since else None,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SavedJob(BaseModel):
    __tablename__ = 'saved_jobs'
    __table_args__ = (db.UniqueConstraint('user_id', 'job_id', name='uq_user_job'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False)
    # Pipeline statuses for kanban tracker
    status = db.Column(db.String(50), default='saved', index=True)  # saved, applied, interviewing, offered, rejected
    notes = db.Column(db.Text)

    job = db.relationship('Job', backref='saved_instances')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'job': self.job.to_dict() if self.job else None,
        }
