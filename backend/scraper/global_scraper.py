"""
scraper/global_scraper.py
--------------------------
Global / US jobs scraper — inherits BaseScraper.
No hardcoded URLs. All config from settings.
"""
import logging
from datetime import datetime, timezone
from scraper.base_scraper import BaseScraper, ScraperConfig
from scraper.parser import parse_global_listing_page, parse_max_pagination_pages
from models.job import Job, generate_job_dedupe_key
from core.extensions import db
from core.config import settings

logger = logging.getLogger(__name__)


class GlobalScraper(BaseScraper):
    """
    Scrapes Global/US job listings.
    URL pattern: {base_url}/global?page={n}
    """

    def __init__(self, config: ScraperConfig = None):
        super().__init__(config or ScraperConfig())

    def get_listing_url(self, page: int) -> str:
        return f"{self.config.base_url}/global?page={page}"

    def parse_page(self, html: str, url: str) -> list[dict]:
        return parse_global_listing_page(html, url)

    def _detect_total_pages(self, html: str):
        return parse_max_pagination_pages(html, default=199)

    def _upsert(self, jobs: list[dict]) -> int:
        now_utc = datetime.now(timezone.utc)
        new_count = 0
        try:
            for j in jobs:
                title = j.get('title', '').strip()
                company = j.get('company', '').strip()

                if not title or not company:
                    continue

                d_key = generate_job_dedupe_key(title, company, 'Global')
                existing = Job.query.filter_by(dedupe_key=d_key).first()

                if existing:
                    existing.is_new_today = j.get('is_new_today', existing.is_new_today)
                    if j.get('pay'):
                        existing.pay = j['pay']
                else:
                    new_job = Job(
                        dedupe_key=d_key,
                        title=title,
                        company=company,
                        location=j.get('location', 'US / Global Remote'),
                        region='Global / US',
                        job_type=j.get('type', 'Full-time'),
                        pay=j.get('pay', 'Competitive ($USD)'),
                        batch=None,
                        is_new_today=j.get('is_new_today', False),
                        posted_date_text=j.get('posted_date_text', 'Recently'),
                        is_early_access=j.get('is_early_access', False),
                        snippet=j.get('snippet', ''),
                        description=j.get('description', ''),
                        apply_url=j.get('apply_url') or j.get('detail_url') or '',
                        apply_kind='link',
                        detail_url=j.get('detail_url', ''),
                        source_url=j.get('source_url', ''),
                        source='joborbit_global_feed',
                        posted_at=now_utc,
                    )
                    db.session.add(new_job)
                    new_count += 1

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Global scraper upsert error: {e}")
        return new_count
