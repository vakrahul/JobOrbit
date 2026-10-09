import hashlib
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def generate_job_dedupe_key(title: str, company: str, location: str) -> str:
    raw = f"{title.strip().lower()}|{company.strip().lower()}|{location.strip().lower()}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def generate_hr_dedupe_key(name: str, company: str, linkedin_url: str = None) -> str:
    if linkedin_url and linkedin_url.strip():
        raw = linkedin_url.strip().lower()
    else:
        raw = f"{name.strip().lower()}|{company.strip().lower()}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

class Job(db.Model):
    __tablename__ = 'jobs'

    id = db.Column(db.Integer, primary_key=True)
    dedupe_key = db.Column(db.String(64), unique=True, index=True, nullable=False)
    title = db.Column(db.String(255), nullable=False, index=True)
    company = db.Column(db.String(255), nullable=False, index=True)
    location = db.Column(db.String(255), default='Remote / India', index=True)
    region = db.Column(db.String(50), default='India', index=True) # 'India' or 'Global / US'
    job_type = db.Column(db.String(100), default='Full-time', index=True) # Full-time, Internship, etc.
    pay = db.Column(db.String(100), default='Competitive')
    batch = db.Column(db.String(100), nullable=True) # e.g. "2025/2026/2027"
    is_new_today = db.Column(db.Boolean, default=False, index=True)
    posted_date_text = db.Column(db.String(50), default='Recently') # e.g. "Today", "Yesterday"
    is_early_access = db.Column(db.Boolean, default=False, index=True)
    snippet = db.Column(db.Text)
    description = db.Column(db.Text) # Full "About the role" description
    apply_url = db.Column(db.String(1024), nullable=True, default='')
    apply_kind = db.Column(db.String(50), default='link') # 'link' or 'email'
    detail_url = db.Column(db.String(1024))
    source_url = db.Column(db.String(1024))
    source = db.Column(db.String(64), default='joborbit_feed')
    page_num = db.Column(db.Integer, default=1, index=True)
    is_featured = db.Column(db.Boolean, default=False)
    posted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        raw_apply = (self.apply_url or '').strip()
        is_email = raw_apply.lower().startswith('mailto:')
        email_recipient = raw_apply[7:].split('?')[0].strip() if is_email else None

        import urllib.parse
        clean_comp = (self.company or '').strip()
        clean_tit = (self.title or '').strip()
        search_kw = urllib.parse.quote(f"{clean_comp} {clean_tit}".strip())
        career_url = f"https://www.linkedin.com/jobs/search/?keywords={search_kw}"

        if is_email:
            clean_apply_url = raw_apply
            is_external = False
            apply_kind = 'email'
        elif raw_apply.startswith('http') and not any(k in raw_apply.lower() for k in ['carrerlift', 'careerlift', 'localhost', '127.0.0.1']):
            clean_apply_url = raw_apply
            is_external = True
            apply_kind = 'external'
        else:
            clean_apply_url = career_url
            is_external = True
            apply_kind = 'external'

        clean_detail_url = f"/jobs/{self.id}"

        from scraper.salary_helper import infer_natural_salary
        clean_pay = infer_natural_salary(self.title, self.company, self.location, self.region, self.job_type, self.pay)
        clean_title = (self.title or '').replace('â¹', '₹').replace('â', '₹').strip()
        clean_snippet = (self.snippet or '').replace('â¹', '₹').replace('â', '₹').strip()
        clean_desc = (self.description or '').replace('â¹', '₹').replace('â', '₹').strip()

        # Determine location & remote status
        loc = (self.location or 'India').strip()
        is_remote = 'remote' in loc.lower() or 'remote' in clean_title.lower() or 'remote' in clean_snippet.lower()

        apply_kind = 'email' if is_email else ('external' if is_external else 'internal')

        is_new = bool(self.is_new_today or (self.posted_date_text and self.posted_date_text.strip().lower() == 'today'))
        date_text = 'Today' if is_new else (self.posted_date_text or 'Recently')

        return {
            'id': self.id,
            'title': clean_title,
            'company': self.company,
            'location': loc,
            'is_remote': is_remote,
            'region': self.region,
            'type': self.job_type,
            'pay': clean_pay,
            'batch': self.batch,
            'is_new_today': is_new,
            'posted_date_text': date_text,
            'is_early_access': is_new,
            'snippet': clean_snippet,
            'description': clean_desc,
            'apply_url': clean_apply_url,
            'is_external_apply': is_external,
            'is_email_apply': is_email,
            'email_recipient': email_recipient,
            'apply_kind': apply_kind,
            'detail_url': clean_detail_url,
            'source': 'JobOrbit Direct',
            'is_featured': self.is_featured,
            'page_num': self.page_num or 1,
            'posted_at': self.posted_at.isoformat() if self.posted_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255))
    avatar_url = db.Column(db.String(1024))
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    is_premium = db.Column(db.Boolean, default=False)
    premium_since = db.Column(db.DateTime, nullable=True)
    razorpay_payment_id = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(50), default='user')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    saved_jobs = db.relationship('SavedJob', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'is_premium': self.is_premium,
            'premium_since': self.premium_since.isoformat() if self.premium_since else None,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SavedJob(db.Model):
    __tablename__ = 'saved_jobs'
    __table_args__ = (db.UniqueConstraint('user_id', 'job_id', name='uq_user_job'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(50), default='saved') # saved, applied, interviewing, offered, rejected
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    job = db.relationship('Job', backref='saved_instances')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'job': self.job.to_dict() if self.job else None
        }

class HRContact(db.Model):
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
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self, is_premium: bool = True):
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
                'linkedin_url': self.linkedin_url[:28] + '...' if self.linkedin_url else None,
                'email': obfuscated_email,
                'email_status': self.email_status,
                'is_locked': True
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
            'is_locked': False
        }

class ScrapeLog(db.Model):
    __tablename__ = 'scrape_logs'

    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(50), default='started')
    jobs_found = db.Column(db.Integer, default=0)
    jobs_added = db.Column(db.Integer, default=0)
    jobs_updated = db.Column(db.Integer, default=0)
    hr_contacts_added = db.Column(db.Integer, default=0)
    source = db.Column(db.String(100), default='public_sources')
    message = db.Column(db.Text)
    duration_sec = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'status': self.status,
            'jobs_found': self.jobs_found,
            'jobs_added': self.jobs_added,
            'jobs_updated': self.jobs_updated,
            'hr_contacts_added': self.hr_contacts_added,
            'source': self.source,
            'message': self.message,
            'duration_sec': round(self.duration_sec, 2),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ProfessorContact(db.Model):
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
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'institute': self.institute,
            'department': self.department,
            'research_areas': self.research_areas,
            'email': self.email,
            'website_url': self.website_url,
            'source_url': self.source_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PrepQuestion(db.Model):
    __tablename__ = 'prep_questions'

    id = db.Column(db.Integer, primary_key=True)
    track = db.Column(db.String(50), nullable=False, index=True) # 'ai-engineer' or 'system-design'
    topic = db.Column(db.String(100), nullable=False, index=True)
    topic_label = db.Column(db.String(100))
    difficulty = db.Column(db.String(20), default='Medium', index=True) # 'Easy', 'Medium', 'Hard'
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    key_takeaways = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'track': self.track,
            'topic': self.topic,
            'topic_label': self.topic_label or self.topic.replace('-', ' ').title(),
            'difficulty': self.difficulty,
            'question': self.question,
            'answer': self.answer,
            'key_takeaways': self.key_takeaways,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
