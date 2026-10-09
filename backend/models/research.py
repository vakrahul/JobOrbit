"""
models/research.py — ProfessorContact model
"""
from core.extensions import db
from models.base import BaseModel


class ProfessorContact(BaseModel):
    __tablename__ = 'professor_contacts'

    id = db.Column(db.Integer, primary_key=True)
    dedupe_key = db.Column(db.String(64), unique=True, index=True, nullable=False)
    name = db.Column(db.String(255), nullable=False, index=True)
    institute = db.Column(db.String(255), nullable=False, index=True)
    department = db.Column(db.String(255), index=True)
    research_areas = db.Column(db.Text)
    email = db.Column(db.String(255), index=True)
    website_url = db.Column(db.String(1024))
    source_url = db.Column(db.String(1024))

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'institute': self.institute,
            'department': self.department,
            'research_areas': self.research_areas,
            'email': self.email,
            'website_url': self.website_url,
            'source_url': self.source_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
