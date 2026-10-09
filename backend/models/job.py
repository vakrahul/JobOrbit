"""
models/job.py — Job listing model
"""
import hashlib
from core.extensions import db
from models.base import BaseModel, TimestampMixin
from datetime import datetime, timezone


def generate_job_dedupe_key(title: str, company: str, location: str) -> str:
    raw = f"{title.strip().lower()}|{company.strip().lower()}|{location.strip().lower()}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


def get_job_platform_and_template(
    title: str, company: str, location: str, pay: str,
    job_type: str, source: str, apply_url: str,
    source_url: str, snippet: str, description: str
):
    import re
    raw_s = (source or '').lower()
    raw_a = (apply_url or '').lower()
    raw_su = (source_url or '').lower()
    combined_desc = f"{snippet or ''} {description or ''}"

    # Extract any recruiter email
    emails = list(dict.fromkeys(re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", combined_desc)))
    emails = [e for e in emails if not e.endswith(('.png', '.jpg', '.jpeg', '.svg', '.gif'))]

    # Detect platform
    if 'linkedin' in raw_s or 'linkedin.com' in raw_a or 'linkedin.com' in raw_su:
        platform_id = 'linkedin'
        platform_name = 'LinkedIn'
        badge_label = 'LinkedIn Direct'
        badge_color = 'blue'

        template = {
            'platform': 'linkedin',
            'platform_name': 'LinkedIn',
            'badge_label': 'LinkedIn Direct',
            'badge_color': 'blue',
            'template_type': 'LinkedIn Recruiter InMail & Connection Note',
            'connection_note': f"Hi {company} Hiring Team, I saw the {title} opening. With experience in modern software engineering and building scalable systems, I would love to connect and contribute!",
            'email_subject': f"Application: {title} — [Candidate Name]",
            'email_pitch': (
                f"Dear {company} Hiring Team,\n\n"
                f"I noticed your recent {title} opening on LinkedIn. Having built modern production web applications and distributed systems, I am excited about {company}'s work. My experience aligns closely with your stack requirements.\n\n"
                f"Could we connect briefly for a quick chat regarding the role? My resume and projects are available for review.\n\n"
                f"Best regards,\n[Your Name]\n[Portfolio / GitHub / LinkedIn]"
            ),
            'action_button_text': 'Apply via LinkedIn',
            'copy_button_text': 'Copy Connection Note (300 chars)',
            'recruiter_emails': emails,
        }
    elif 'internshala' in raw_s or 'internshala.com' in raw_a or 'internshala.com' in raw_su:
        platform_id = 'internshala'
        platform_name = 'Internshala'
        badge_label = 'Internshala Tech'
        badge_color = 'cyan'

        template = {
            'platform': 'internshala',
            'platform_name': 'Internshala',
            'badge_label': 'Internshala Tech',
            'badge_color': 'cyan',
            'template_type': 'Internshala "Why Should You Be Hired?" Answer',
            'connection_note': (
                f"I am eager to apply for the {title} internship at {company}. "
                f"I have hands-on experience developing projects in modern tech stacks, strong problem-solving fundamentals, "
                f"and can contribute from Day 1. I am available for the entire duration and excited to deliver high-quality code."
            ),
            'email_subject': f"Internshala Application: {title} — [Candidate Name]",
            'email_pitch': (
                f"Dear {company} Hiring Team,\n\n"
                f"I am applying for the {title} position on Internshala. I have built functional software projects, "
                f"understand collaborative git workflows, and can dedicate 35–40 hours/week to meet your team's sprint targets.\n\n"
                f"I am ready to start immediately and look forward to the interview rounds!\n\n"
                f"Best regards,\n[Your Name]\n[GitHub / Portfolio]"
            ),
            'action_button_text': 'Apply on Internshala',
            'copy_button_text': 'Copy "Why Hire Me" Answer',
            'recruiter_emails': emails,
        }
    elif 'wellfound' in raw_s or 'wellfound.com' in raw_a or 'angel.co' in raw_a or 'wellfound.com' in raw_su:
        platform_id = 'wellfound'
        platform_name = 'Wellfound'
        badge_label = 'Wellfound Startup'
        badge_color = 'purple'

        template = {
            'platform': 'wellfound',
            'platform_name': 'Wellfound',
            'badge_label': 'Wellfound Startup',
            'badge_color': 'purple',
            'template_type': 'Founder & Early-Stage Startup Pitch Note',
            'connection_note': (
                f"Hey {company} Team! I came across your {title} opening on Wellfound and love what you're building. "
                f"As a developer who thrives in fast-paced startup environments and takes ownership from zero to one, "
                f"I'd love to jump in and accelerate your product roadmap."
            ),
            'email_subject': f"Joining {company} as {title} — [Candidate Name]",
            'email_pitch': (
                f"Hey {company} Founders & Team,\n\n"
                f"I saw the {title} opening on Wellfound and have been tracking your product vision. "
                f"I specialize in building full-stack applications with high velocity, clean architecture, and rapid deployment cycles.\n\n"
                f"I thrive without micromanagement, write testable code, and would love to help push {company} forward. "
                f"Let's set up a quick 10-minute chat!\n\n"
                f"Cheers,\n[Your Name]\n[GitHub / Portfolio]"
            ),
            'action_button_text': 'Apply on Wellfound',
            'copy_button_text': 'Copy Founder Pitch Note',
            'recruiter_emails': emails,
        }
    else:
        platform_id = 'careerlift'
        platform_name = 'JobOrbit Direct'
        badge_label = 'JobOrbit Direct'
        badge_color = 'emerald'

        template = {
            'platform': 'careerlift',
            'platform_name': 'JobOrbit Direct',
            'badge_label': 'JobOrbit Direct',
            'badge_color': 'emerald',
            'template_type': 'Executive Cover Letter & Application Pitch',
            'connection_note': f"Dear {company} Team, I am expressing my strong interest in the {title} role. With a proven record in software engineering and rapid execution, I welcome the chance to connect.",
            'email_subject': f"Application: {title} — [Candidate Name]",
            'email_pitch': (
                f"Dear {company} Talent Acquisition,\n\n"
                f"I am writing to express my strong enthusiasm for the {title} position at {company}. "
                f"With a solid foundation in computer science and modern software engineering, I have delivered scalable solutions "
                f"and look forward to contributing to your engineering milestones.\n\n"
                f"My resume and portfolio are available for your evaluation. I welcome the opportunity to discuss my qualifications.\n\n"
                f"Sincerely,\n[Your Name]\n[Phone]\n[Portfolio / GitHub / LinkedIn]"
            ),
            'action_button_text': f'Apply on {company} Careers',
            'copy_button_text': 'Copy Application Pitch',
            'recruiter_emails': emails,
        }

    return {
        'id': platform_id,
        'name': platform_name,
        'badge_label': badge_label,
        'badge_color': badge_color,
    }, badge_label, template


class Job(BaseModel):
    __tablename__ = 'jobs'

    id = db.Column(db.Integer, primary_key=True)
    dedupe_key = db.Column(db.String(64), unique=True, index=True, nullable=False)
    title = db.Column(db.String(255), nullable=False, index=True)
    company = db.Column(db.String(255), nullable=False, index=True)
    location = db.Column(db.String(255), default='Remote / India', index=True)
    region = db.Column(db.String(50), default='India', index=True)
    job_type = db.Column(db.String(100), default='Full-time', index=True)
    pay = db.Column(db.String(100), default='Competitive')
    batch = db.Column(db.String(100), nullable=True)
    is_new_today = db.Column(db.Boolean, default=False, index=True)
    posted_date_text = db.Column(db.String(50), default='Recently')
    is_early_access = db.Column(db.Boolean, default=False, index=True)
    is_featured = db.Column(db.Boolean, default=False)
    snippet = db.Column(db.Text)
    description = db.Column(db.Text)
    apply_url = db.Column(db.String(1024), nullable=True, default='')
    apply_kind = db.Column(db.String(50), default='link')
    detail_url = db.Column(db.String(1024))
    source_url = db.Column(db.String(1024))
    source = db.Column(db.String(64), default='joborbit_feed')
    page_num = db.Column(db.Integer, default=1, index=True)
    posted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_deleted = db.Column(db.Boolean, default=False, index=True)

    def to_dict(self) -> dict:
        raw_apply = (self.apply_url or '').strip()
        is_email = raw_apply.lower().startswith('mailto:')
        email_recipient = raw_apply[7:].split('?')[0].strip() if is_email else None
        raw_source = (self.source_url or '').strip()
        
        import urllib.parse
        clean_comp = (self.company or '').strip()
        clean_tit = (self.title or '').strip()
        search_kw = urllib.parse.quote(f"{clean_comp} {clean_tit}".strip())
        career_url = f"https://www.linkedin.com/jobs/search/?keywords={search_kw}"

        if is_email:
            resolved_apply = raw_apply
            is_external = False
            apply_kind = 'email'
        elif raw_apply.startswith('http') and not any(k in raw_apply.lower() for k in ['carrerlift', 'careerlift', 'localhost', '127.0.0.1']):
            resolved_apply = raw_apply
            is_external = True
            apply_kind = 'external'
        elif raw_source.startswith('http') and not any(k in raw_source.lower() for k in ['carrerlift', 'careerlift', 'localhost', '127.0.0.1']):
            resolved_apply = raw_source
            is_external = True
            apply_kind = 'external'
        else:
            resolved_apply = career_url
            is_external = True
            apply_kind = 'external'

        try:
            from scraper.salary_helper import infer_natural_salary
            clean_pay = infer_natural_salary(
                self.title, self.company, self.location,
                self.region, self.job_type, self.pay
            )
        except Exception:
            clean_pay = self.pay or 'Competitive'

        def _clean(s):
            return (s or '').replace('â¹', '₹').replace('â', '₹').strip()

        loc = _clean(self.location) or 'India'
        clean_title = _clean(self.title)
        clean_snippet = _clean(self.snippet)
        is_remote = 'remote' in loc.lower() or 'remote' in clean_title.lower()
        is_new = bool(self.is_new_today or (self.posted_date_text or '').strip().lower() == 'today')

        platform_meta, source_badge, ready_template = get_job_platform_and_template(
            title=clean_title,
            company=self.company,
            location=loc,
            pay=clean_pay,
            job_type=self.job_type,
            source=self.source,
            apply_url=resolved_apply,
            source_url=self.source_url,
            snippet=clean_snippet,
            description=_clean(self.description)
        )

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
            'posted_date_text': 'Today' if is_new else (self.posted_date_text or 'Recently'),
            'is_early_access': is_new,
            'snippet': clean_snippet,
            'description': _clean(self.description),
            'apply_url': resolved_apply if (is_external or is_email) else None,
            'is_external_apply': is_external,
            'is_email_apply': is_email,
            'email_recipient': email_recipient or (ready_template.get('recruiter_emails')[0] if ready_template.get('recruiter_emails') else None),
            'apply_kind': apply_kind,
            'detail_url': f"/jobs/{self.id}",
            'source_url': resolved_apply if (not self.source_url or self.source_url.startswith('/') or 'carrerlift' in self.source_url.lower()) else self.source_url,
            'source': source_badge,
            'source_platform': platform_meta,
            'ready_template': ready_template,
            'is_featured': self.is_featured,
            'page_num': self.page_num or 1,
            'posted_at': self.posted_at.isoformat() if self.posted_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

