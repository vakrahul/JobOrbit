"""
models/base.py
--------------
Abstract base classes and mixins shared by all models.
"""
import hashlib
from datetime import datetime, timezone
from core.extensions import db


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now():
    return datetime.now(timezone.utc)


# ── Mixins ────────────────────────────────────────────────────────────────────

class TimestampMixin:
    """Automatically tracks created_at and updated_at."""
    created_at = db.Column(db.DateTime, default=_now, index=True, nullable=True)
    updated_at = db.Column(db.DateTime, default=_now, onupdate=_now, nullable=True)


class SoftDeleteMixin:
    """Marks records as deleted without removing them from the DB."""
    is_deleted = db.Column(db.Boolean, default=False, index=True, nullable=True)
    deleted_at = db.Column(db.DateTime, nullable=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = _now()
        db.session.add(self)
        db.session.commit()


# ── Base Model ────────────────────────────────────────────────────────────────

class BaseModel(db.Model, TimestampMixin):
    """
    Abstract base model with:
    - auto timestamps (created_at, updated_at)
    - save() / delete() convenience methods
    """
    __abstract__ = True

    def save(self):
        """Persist this record to DB."""
        db.session.add(self)
        db.session.commit()
        return self

    def delete(self):
        """Hard delete this record."""
        db.session.delete(self)
        db.session.commit()

    @classmethod
    def get_by_id(cls, record_id: int):
        return cls.query.get(record_id)

    def to_dict(self) -> dict:
        raise NotImplementedError(f"{self.__class__.__name__}.to_dict() must be implemented")

    def __repr__(self):
        return f"<{self.__class__.__name__} id={getattr(self, 'id', '?')}>"
