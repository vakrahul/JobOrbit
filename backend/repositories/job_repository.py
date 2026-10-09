"""
repositories/job_repository.py
--------------------------------
All database access for Job records.
No raw Job.query calls should exist in routes — they all go through here.
"""
from typing import Optional
from sqlalchemy import or_
from models.job import Job, generate_job_dedupe_key
from models.audit import ScrapeLog
from core.extensions import db
from core.url_sanitizer import sanitize_job_url


class JobRepository:
    """
    OOP repository for Job model.
    Encapsulates all DB query logic behind a clean interface.
    """

    # ── Read ────────────────────────────────────────────────────────────────

    def get_by_id(self, job_id: int) -> Optional[Job]:
        return Job.query.filter_by(id=job_id, is_deleted=False).first()

    def get_by_dedupe_key(self, key: str) -> Optional[Job]:
        return Job.query.filter_by(dedupe_key=key).first()

    def get_total_count(self) -> int:
        return Job.query.filter_by(is_deleted=False).count()

    def get_region_count(self, region: str) -> int:
        return Job.query.filter_by(region=region, is_deleted=False).count()

    def get_new_today_count(self) -> int:
        return Job.query.filter_by(is_new_today=True, is_deleted=False).count()

    def search(
        self,
        q: str = '',
        region: str = '',
        job_type: str = '',
        batch: str = '',
        location: str = '',
        remote: bool = False,
        new_today: bool = False,
        page: int = 1,
        limit: int = 24,
    ) -> tuple[list[Job], int, int]:
        """
        Returns (jobs, filtered_total, global_total).
        """
        query = Job.query.filter_by(is_deleted=False)

        if q:
            query = query.filter(or_(
                Job.title.ilike(f'%{q}%'),
                Job.company.ilike(f'%{q}%'),
                Job.location.ilike(f'%{q}%'),
                Job.snippet.ilike(f'%{q}%'),
                Job.description.ilike(f'%{q}%'),
            ))

        if region and region.lower() not in ('all', ''):
            query = query.filter(Job.region.ilike(f'%{region}%'))

        if job_type and job_type.lower() not in ('all', ''):
            query = query.filter(Job.job_type.ilike(f'%{job_type}%'))

        if batch and batch.lower() not in ('all', ''):
            query = query.filter(Job.batch.ilike(f'%{batch}%'))

        if location and location.lower() not in ('all', ''):
            if location.lower() == 'remote':
                query = query.filter(or_(
                    Job.location.ilike('%remote%'),
                    Job.location.ilike('%work from home%'),
                    Job.location.ilike('%wfh%'),
                    Job.title.ilike('%remote%'),
                ))
            else:
                query = query.filter(Job.location.ilike(f'%{location}%'))

        if remote:
            query = query.filter(or_(
                Job.location.ilike('%remote%'),
                Job.location.ilike('%work from home%'),
                Job.location.ilike('%wfh%'),
                Job.title.ilike('%remote%'),
            ))


        if new_today:
            query = query.filter(Job.is_new_today == True)

        total = query.count()
        global_total = self.get_total_count()

        jobs = (
            query
            .order_by(Job.is_new_today.desc(), Job.page_num.asc(), Job.id.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return jobs, total, global_total

    def get_filter_options(self) -> dict:
        types = [t[0] for t in db.session.query(Job.job_type).filter_by(is_deleted=False).distinct() if t[0]]
        regions = [r[0] for r in db.session.query(Job.region).filter_by(is_deleted=False).distinct() if r[0]]
        locations = [l[0] for l in db.session.query(Job.location).filter_by(is_deleted=False).distinct().limit(40) if l[0]]
        return {
            'types': sorted(types),
            'regions': sorted(regions),
            'locations': sorted(locations),
            'common_batches': ['2024', '2025', '2026', '2027', '2028', '2029'],
        }

    def get_recent_for_matching(self, limit: int = 150) -> list[Job]:
        return Job.query.filter_by(is_deleted=False).order_by(Job.id.desc()).limit(limit).all()

    # ── Write ───────────────────────────────────────────────────────────────

    def upsert(self, data: dict, region: str) -> tuple[Job, bool]:
        """
        Insert or update a job.
        Returns (job_instance, is_new_record).
        """
        existing = self.get_by_dedupe_key(data['dedupe_key'])
        if existing:
            # Update mutable fields only
            for field in ('is_new_today', 'posted_date_text', 'is_early_access', 'page_num', 'pay'):
                if data.get(field) is not None:
                    setattr(existing, field, data[field])
            db.session.add(existing)
            return existing, False

        job = Job(region=region, **{k: v for k, v in data.items() if hasattr(Job, k)})
        db.session.add(job)
        return job, True

    def enrich_description(self, job: Job, description: str) -> None:
        job.description = description
        db.session.add(job)
        db.session.commit()

    def create(self, data: dict) -> Job:
        """Admin creation of a new job record."""
        title = data.get('title', '').strip()
        company = data.get('company', '').strip()
        location = data.get('location', 'Remote / India').strip()
        dedupe_key = generate_job_dedupe_key(title, company, location)

        apply_url = sanitize_job_url(data.get('apply_url', ''), company, title)
        existing = Job.query.filter_by(dedupe_key=dedupe_key).first()
        if existing:
            existing.is_deleted = False
            for k in ('region', 'job_type', 'pay', 'batch', 'snippet', 'description', 'is_new_today', 'is_early_access', 'is_featured'):
                if k in data:
                    setattr(existing, k, data[k])
            existing.apply_url = apply_url
            existing.source_url = apply_url
            db.session.commit()
            return existing

        job = Job(
            dedupe_key=dedupe_key,
            title=title,
            company=company,
            location=location,
            region=data.get('region', 'India'),
            job_type=data.get('job_type', 'Full-time'),
            pay=data.get('pay', 'Competitive'),
            batch=data.get('batch'),
            snippet=data.get('snippet', f"{title} at {company}"),
            description=data.get('description', data.get('snippet', '')),
            apply_url=apply_url,
            source_url=apply_url,
            source=data.get('source', 'admin_manual'),
            is_new_today=data.get('is_new_today', True),
            is_early_access=data.get('is_early_access', False),
            is_featured=data.get('is_featured', False),
            is_deleted=False,
        )
        db.session.add(job)
        db.session.commit()
        return job

    def update(self, job_id: int, data: dict) -> Optional[Job]:
        """Admin update of an existing job."""
        job = Job.query.filter_by(id=job_id).first()
        if not job:
            return None

        # If title/company/location change, update dedupe_key
        title = data.get('title', job.title).strip()
        company = data.get('company', job.company).strip()
        location = data.get('location', job.location).strip()
        job.dedupe_key = generate_job_dedupe_key(title, company, location)

        for k, v in data.items():
            if hasattr(job, k) and k not in ('id', 'created_at', 'dedupe_key'):
                setattr(job, k, v)

        if 'apply_url' in data:
            job.apply_url = sanitize_job_url(data['apply_url'], company, title)
            job.source_url = job.apply_url

        db.session.commit()
        return job

    def soft_delete(self, job_id: int) -> bool:
        job = Job.query.filter_by(id=job_id).first()
        if not job:
            return False
        job.is_deleted = True
        db.session.commit()
        return True

    def hard_delete(self, job_id: int) -> bool:
        job = Job.query.filter_by(id=job_id).first()
        if not job:
            return False
        db.session.delete(job)
        db.session.commit()
        return True

    # ── Stats ────────────────────────────────────────────────────────────────

    def get_total_count(self) -> int:
        return Job.query.filter_by(is_deleted=False).count()

    def get_region_count(self, region: str) -> int:
        return Job.query.filter_by(region=region, is_deleted=False).count()

    def get_new_today_count(self) -> int:
        return Job.query.filter_by(is_new_today=True, is_deleted=False).count()

    def get_early_access_count(self) -> int:
        return Job.query.filter_by(is_early_access=True, is_deleted=False).count()

    def get_stats_summary(self) -> dict:
        return {
            'total_jobs': self.get_total_count(),
            'india_jobs': self.get_region_count('India'),
            'global_jobs': self.get_region_count('Global / US'),
            'new_today': self.get_new_today_count(),
            'early_access': self.get_early_access_count(),
        }


# ── Singleton instance ────────────────────────────────────────────────────────
job_repo = JobRepository()
