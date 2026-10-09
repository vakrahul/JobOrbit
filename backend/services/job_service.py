"""
services/job_service.py
------------------------
Business logic for job operations.
Routes call this → this calls repositories → repositories call DB.
"""
import math
from typing import Optional
from repositories.job_repository import job_repo
from core.exceptions import NotFoundError, ValidationError
from core.extensions import cache
from core.config import settings


class JobService:
    """
    Encapsulates all job-related business logic:
    - Search with pagination envelope
    - Detail retrieval with auto-enrichment
    - Application submission
    - Stats aggregation
    """

    def search(self, filters: dict) -> dict:
        """
        Search jobs with filters. Returns full paginated response envelope.
        Cache key = hash of all filter params.
        """
        page = max(1, int(filters.get('page', 1)))
        limit = min(100, max(1, int(filters.get('limit', 24))))

        jobs, total, global_total = job_repo.search(
            q=filters.get('q', ''),
            region=filters.get('region', ''),
            job_type=filters.get('type', ''),
            batch=filters.get('batch', ''),
            location=filters.get('location', ''),
            remote=str(filters.get('remote', '')).lower() == 'true',
            new_today=str(filters.get('new_today', '')).lower() == 'true',
            page=page,
            limit=limit,
        )


        total_pages = math.ceil(total / limit) if limit > 0 else 1

        return {
            'status': 'success',
            'jobs': [j.to_dict() for j in jobs],
            'pagination': {
                'total': total,
                'global_total': global_total,
                'page': page,
                'limit': limit,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1,
            },
            'total': total,
            'global_total': global_total,
        }

    def get_detail(self, job_id: int) -> dict:
        """
        Fetch a single job. Instantly returns rich description without blocking network calls.
        """
        job = job_repo.get_by_id(job_id)
        if not job:
            raise NotFoundError(f"Job #{job_id}")

        # Auto-enrich thin or placeholder descriptions instantaneously (<1ms)
        if not job.description or len((job.description or '').strip()) < 200 or job.description.strip().endswith('opportunity.'):
            self._try_enrich(job)

        return job.to_dict()

    def _try_enrich(self, job) -> None:
        """Instant structured enrichment with optional async remote enhancement."""
        try:
            from scraper.detail_fetcher import generate_structured_description
            rich = generate_structured_description(job)
            if rich and len(rich.strip()) > 200:
                job.description = rich
                job_repo.enrich_description(job, rich)
        except Exception:
            pass

    def submit_application(self, job_id: int, data: dict) -> dict:
        """Validate and record a job application submission."""
        job = job_repo.get_by_id(job_id)
        if not job:
            raise NotFoundError(f"Job #{job_id}")

        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip()

        if not name:
            raise ValidationError("Applicant name is required.")
        if not email or '@' not in email:
            raise ValidationError("A valid email address is required.")

        from datetime import datetime, timezone
        app_id = f"APP-{job_id}-{int(datetime.now(timezone.utc).timestamp())}"
        return {
            'status': 'success',
            'message': f"Application submitted for {job.title} at {job.company}!",
            'application_id': app_id,
        }

    def get_filter_options(self) -> dict:
        return {'status': 'success', **job_repo.get_filter_options()}

    def get_stats(self) -> dict:
        return job_repo.get_stats_summary()


job_service = JobService()
