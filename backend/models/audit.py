"""
models/audit.py — ScrapeLog audit trail model
"""
from core.extensions import db
from models.base import BaseModel


class ScrapeLog(BaseModel):
    __tablename__ = 'scrape_logs'

    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(50), default='started', index=True)
    jobs_found = db.Column(db.Integer, default=0)
    jobs_added = db.Column(db.Integer, default=0)
    jobs_updated = db.Column(db.Integer, default=0)
    hr_contacts_added = db.Column(db.Integer, default=0)
    source = db.Column(db.String(100), default='public_sources')
    message = db.Column(db.Text)
    duration_sec = db.Column(db.Float, default=0.0)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'status': self.status,
            'jobs_found': self.jobs_found,
            'jobs_added': self.jobs_added,
            'jobs_updated': self.jobs_updated,
            'hr_contacts_added': self.hr_contacts_added,
            'source': self.source,
            'message': self.message,
            'duration_sec': round(self.duration_sec or 0, 2),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
