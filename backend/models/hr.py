"""
models/hr.py — HRContact model
"""
import hashlib
from core.extensions import db
from models.base import BaseModel


def generate_hr_dedupe_key(name: str, company: str, linkedin_url: str = None) -> str:
    if linkedin_url and linkedin_url.strip():
        raw = linkedin_url.strip().lower()
    else:
        raw = f"{name.strip().lower()}|{company.strip().lower()}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


class HRContact(BaseModel):
    __tablename__ = 'hr_contacts'

    id = db.Column(db.Integer, primary_key=True)
    dedupe_key = db.Column(db.String(64), unique=True, index=True, nullable=False)
    name = db.Column(db.String(255), nullable=False, index=True)
    title = db.Column(db.String(255))
    company = db.Column(db.String(255), nullable=False, index=True)
    company_website = db.Column(db.String(512))
    company_niche = db.Column(db.String(255))
    location = db.Column(db.String(255))
    linkedin_url = db.Column(db.String(1024))
    email = db.Column(db.String(255))
    email_status = db.Column(db.String(50), default='unverified')
    source_url = db.Column(db.String(1024))
    verified_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self, is_premium: bool = True) -> dict:
        if not is_premium:
            obfuscated_email = None
            if self.email:
                parts = self.email.split('@')
                obfuscated_email = f"{parts[0][:2]}***@{parts[1]}" if len(parts) == 2 else '***@***'
            return {
                'id': self.id,
                'name': self.name,
                'title': self.title,
                'company': self.company,
                'company_website': self.company_website,
                'company_niche': self.company_niche,
                'location': self.location,
                'linkedin_url': (self.linkedin_url[:28] + '...') if self.linkedin_url else None,
                'email': obfuscated_email,
                'email_status': self.email_status,
                'is_locked': True,
            }
        return {
            'id': self.id,
            'name': self.name,
            'title': self.title,
            'company': self.company,
            'company_website': self.company_website,
            'company_niche': self.company_niche,
            'location': self.location,
            'linkedin_url': self.linkedin_url,
            'email': self.email,
            'email_status': self.email_status,
            'source_url': self.source_url,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_locked': False,
        }
