import os
import sys
import time
import logging
import argparse
import threading
import requests
from datetime import datetime, timezone

# Add backend directory to sys.path so imports work smoothly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from models import db, Job, HRContact, ScrapeLog, generate_job_dedupe_key, generate_hr_dedupe_key
from scraper.config import (
    BASE_URL,
    REQUEST_HEADERS,
    REQUEST_DELAY_SECONDS,
    REQUEST_TIMEOUT_SECONDS,
    HR_DIRECTORY_URL,
)
from scraper.parser import (
    parse_listing_page,
    parse_global_listing_page,
    parse_max_pagination_pages
)
from scraper.hr_scraper import parse_hr_page
from scraper.wellfound_scraper import WellfoundScraper
from core.url_sanitizer import sanitize_job_url

logger = logging.getLogger(__name__)

class SyncProgressManager:
    """
    In-memory state tracker for background sync jobs to feed the Admin Dashboard.
    """
    def __init__(self):
        self.lock = threading.Lock()
        self.is_running = False
        self.target = 'none'
        self.mode = 'incremental' # incremental or full
        self.current_page = 0
        self.total_pages = 0
        self.jobs_extracted = 0
        self.jobs_added = 0
        self.jobs_updated = 0
        self.started_at = None
        self.finished_at = None
        self.logs = []
        self.status = 'idle'
        self.error = None

    def log(self, message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {message}"
        with self.lock:
            self.logs.append(entry)
            if len(self.logs) > 500:
                self.logs.pop(0)
        logger.info(message)

    def start(self, target: str, mode: str = 'incremental', total_pages: int = 0):
        with self.lock:
            self.is_running = True
            self.status = 'running'
            self.target = target
            self.mode = mode
            self.current_page = 0
            self.total_pages = total_pages
            self.jobs_extracted = 0
            self.jobs_added = 0
            self.jobs_updated = 0
            self.started_at = datetime.now(timezone.utc).isoformat()
            self.finished_at = None
            self.error = None
            self.logs = []
        mode_label = "INCREMENTAL (New listings only)" if mode == 'incremental' else "FULL BACKFILL"
        self.log(f"Starting pipeline for '{target}' | Mode: {mode_label}...")

    def update_progress(self, page: int, total: int, extracted: int, added: int = 0, updated: int = 0):
        with self.lock:
            self.current_page = page
            self.total_pages = total
            self.jobs_extracted = extracted
            self.jobs_added += added
            self.jobs_updated += updated

    def finish(self, status: str = 'completed', error: str = None):
        with self.lock:
            self.is_running = False
            self.status = status
            self.finished_at = datetime.now(timezone.utc).isoformat()
            self.error = error
        self.log(f"Pipeline {status}. Newly Ingested: {self.jobs_added}, Updated: {self.jobs_updated}")

    def get_state(self) -> dict:
        with self.lock:
            return {
                'is_running': self.is_running,
                'status': self.status,
                'target': self.target,
                'mode': self.mode,
                'current_page': self.current_page,
                'total_pages': self.total_pages,
                'progress_percent': round((self.current_page / max(1, self.total_pages)) * 100, 1) if self.total_pages else 0,
                'jobs_extracted': self.jobs_extracted,
                'jobs_added': self.jobs_added,
                'jobs_updated': self.jobs_updated,
                'started_at': self.started_at,
                'finished_at': self.finished_at,
                'error': self.error,
                'logs': list(self.logs[-80:])
            }

sync_manager = SyncProgressManager()

class ScraperPipeline:
    def __init__(self, session_delay: float = 0.4):
        self.delay = session_delay
        self.session = requests.Session()
        self.session.headers.update(REQUEST_HEADERS)

    def fetch_page(self, url: str) -> str:
        res = self.session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
        res.raise_for_status()
        return res.text

    def sync_india_jobs(self, incremental: bool = True, max_pages: int = None) -> tuple[int, int, int]:
        """
        Crawls Indian jobs with Chronological Delta / Incremental Stop.
        If incremental=True, stops as soon as an entire page has already been ingested.
        """
        sync_manager.log("Connecting to live India jobs feed...")
        first_page = self.fetch_page(f"{BASE_URL}/jobs?days=all&page=1")
        total_p = parse_max_pagination_pages(first_page, default=163)
        pages_to_crawl = total_p if max_pages is None else min(max_pages, total_p)

        now_utc = datetime.now(timezone.utc)
        extracted = 0
        added = 0
        updated = 0
        consecutive_pages_with_no_new_jobs = 0

        for p in range(1, pages_to_crawl + 1):
            url = f"{BASE_URL}/jobs?days=all&page={p}"
            try:
                html = first_page if p == 1 else self.fetch_page(url)
                jobs = parse_listing_page(html, url, default_region='India')
                extracted += len(jobs)
                p_added = 0
                p_updated = 0

                for j in jobs:
                    title, comp, loc = j['title'], j['company'], j['location']
                    d_key = generate_job_dedupe_key(title, comp, loc)
                    existing = Job.query.filter_by(dedupe_key=d_key).first()

                    if existing:
                        # Refresh dynamic status (e.g. today badge or early access)
                        existing.is_new_today = j.get('is_new_today', existing.is_new_today)
                        existing.posted_date_text = j.get('posted_date_text', existing.posted_date_text)
                        existing.is_early_access = j.get('is_early_access', existing.is_early_access)
                        existing.page_num = p
                        if j.get('pay'):
                            existing.pay = j.get('pay')
                        # Sanitize any legacy carrerlift links on existing jobs
                        if existing.apply_url and ('carrerlift' in existing.apply_url.lower() or 'careerlift' in existing.apply_url.lower()):
                            existing.apply_url = sanitize_job_url(existing.apply_url, comp, title)
                        if existing.source_url and ('carrerlift' in existing.source_url.lower() or 'careerlift' in existing.source_url.lower()):
                            existing.source_url = existing.apply_url
                        if existing.detail_url and ('carrerlift' in existing.detail_url.lower() or 'careerlift' in existing.detail_url.lower()):
                            existing.detail_url = None
                        existing.updated_at = now_utc
                        p_updated += 1
                    else:
                        clean_apply = sanitize_job_url(j.get('apply_url'), comp, title)
                        new_job = Job(
                            dedupe_key=d_key,
                            title=title,
                            company=comp,
                            location=loc,
                            region='India',
                            job_type=j.get('type', 'Full-time'),
                            pay=j.get('pay', 'Competitive'),
                            batch=j.get('batch'),
                            is_new_today=j.get('is_new_today', False),
                            posted_date_text=j.get('posted_date_text', 'Recently'),
                            is_early_access=j.get('is_early_access', False),
                            snippet=j.get('snippet', ''),
                            description=j.get('description', ''),
                            apply_url=clean_apply,
                            apply_kind='external_direct',
                            detail_url=None,
                            source_url=clean_apply,
                            source='joborbit_india_feed',
                            page_num=p,
                            posted_at=now_utc,
                            created_at=now_utc
                        )
                        db.session.add(new_job)
                        p_added += 1

                db.session.commit()
                added += p_added
                updated += p_updated
                sync_manager.update_progress(p, pages_to_crawl, extracted, p_added, p_updated)
                sync_manager.log(f"[India] Page {p}/{pages_to_crawl}: +{p_added} new jobs, {p_updated} verified")

                # INCREMENTAL STOP CHECK:
                # If we are in incremental mode and page 2+ yields 0 new jobs,
                # all subsequent pages are older jobs that were already saved.
                if incremental:
                    if p_added == 0:
                        consecutive_pages_with_no_new_jobs += 1
                    else:
                        consecutive_pages_with_no_new_jobs = 0

                    if consecutive_pages_with_no_new_jobs >= 5:
                        sync_manager.log(f"[Incremental Stop] Reached previously synced cutoff at page {p}. Stopping early to save bandwidth.")
                        break

                time.sleep(self.delay)
            except Exception as e:
                db.session.rollback()
                sync_manager.log(f"[India] Error on page {p}: {e}")

        return extracted, added, updated

    def sync_global_jobs(self, incremental: bool = True, max_pages: int = None) -> tuple[int, int, int]:
        """
        Crawls Global / US jobs with Chronological Delta / Incremental Stop.
        """
        sync_manager.log("Connecting to live Global AI/ML feed...")
        first_page = self.fetch_page(f"{BASE_URL}/global?page=1")
        total_p = parse_max_pagination_pages(first_page, default=199)
        pages_to_crawl = total_p if max_pages is None else min(max_pages, total_p)

        now_utc = datetime.now(timezone.utc)
        extracted = 0
        added = 0
        updated = 0
        consecutive_pages_with_no_new_jobs = 0

        for p in range(1, pages_to_crawl + 1):
            url = f"{BASE_URL}/global?page={p}"
            try:
                html = first_page if p == 1 else self.fetch_page(url)
                jobs = parse_global_listing_page(html, url)
                extracted += len(jobs)
                p_added = 0
                p_updated = 0

                for j in jobs:
                    title, comp = j['title'], j['company']
                    d_key = generate_job_dedupe_key(title, comp, 'Global')
                    existing = Job.query.filter_by(dedupe_key=d_key).first()

                    if existing:
                        existing.is_new_today = j.get('is_new_today', existing.is_new_today)
                        existing.page_num = p
                        if j.get('pay'):
                            existing.pay = j.get('pay')
                        # Sanitize any legacy carrerlift links on existing jobs
                        if existing.apply_url and ('carrerlift' in existing.apply_url.lower() or 'careerlift' in existing.apply_url.lower()):
                            existing.apply_url = sanitize_job_url(existing.apply_url, comp, title)
                        if existing.source_url and ('carrerlift' in existing.source_url.lower() or 'careerlift' in existing.source_url.lower()):
                            existing.source_url = existing.apply_url
                        if existing.detail_url and ('carrerlift' in existing.detail_url.lower() or 'careerlift' in existing.detail_url.lower()):
                            existing.detail_url = None
                        existing.updated_at = now_utc
                        p_updated += 1
                    else:
                        clean_apply = sanitize_job_url(j.get('apply_url'), comp, title)
                        new_job = Job(
                            dedupe_key=d_key,
                            title=title,
                            company=comp,
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
                            apply_url=clean_apply,
                            apply_kind='external_direct',
                            detail_url=None,
                            source_url=clean_apply,
                            source='joborbit_global_feed',
                            page_num=p,
                            posted_at=now_utc,
                            created_at=now_utc
                        )
                        db.session.add(new_job)
                        p_added += 1

                db.session.commit()
                added += p_added
                updated += p_updated
                sync_manager.update_progress(p, pages_to_crawl, extracted, p_added, p_updated)
                sync_manager.log(f"[Global] Page {p}/{pages_to_crawl}: +{p_added} new jobs, {p_updated} verified")

                if incremental:
                    if p_added == 0:
                        consecutive_pages_with_no_new_jobs += 1
                    else:
                        consecutive_pages_with_no_new_jobs = 0

                    if consecutive_pages_with_no_new_jobs >= 5:
                        sync_manager.log(f"[Incremental Stop] Reached previously synced global cutoff at page {p}. Stopping early.")
                        break

                time.sleep(self.delay)
            except Exception as e:
                db.session.rollback()
                sync_manager.log(f"[Global] Error on page {p}: {e}")

        return extracted, added, updated

    def sync_wellfound_jobs(self, incremental: bool = True) -> tuple[int, int, int]:
        """
        Runs the Wellfound India internship scraper.
        Returns (extracted, added, updated).
        """
        sync_manager.log("Connecting to Wellfound India internship feed...")
        try:
            scraper = WellfoundScraper()

            def _cb(url_idx, total_urls, extracted, added):
                sync_manager.update_progress(url_idx, total_urls, extracted, added, 0)
                sync_manager.log(f"[Wellfound] URL {url_idx}/{total_urls}: +{added} new internships")

            result = scraper.run(incremental=incremental, progress_callback=_cb)
            sync_manager.log(
                f"[Wellfound] Done. Extracted={result['extracted']}, "
                f"New={result['added']}, Updated={result['updated']}"
            )
            return result['extracted'], result['added'], result['updated']
        except Exception as e:
            sync_manager.log(f"[Wellfound] Pipeline error: {e}")
            return 0, 0, 0

    def sync_hr_contacts(self) -> int:
        sync_manager.log("Syncing public HR and recruiter contacts...")
        try:
            html = self.fetch_page(HR_DIRECTORY_URL)
            contacts = parse_hr_page(html, HR_DIRECTORY_URL)
            added = 0
            now_utc = datetime.now(timezone.utc)

            for c in contacts:
                name, comp, linkedin = c['name'], c['company'], c.get('linkedin_url')
                d_key = generate_hr_dedupe_key(name, comp, linkedin)
                if not HRContact.query.filter_by(dedupe_key=d_key).first():
                    new_hr = HRContact(
                        dedupe_key=d_key,
                        name=name,
                        title=c.get('title', 'Talent Acquisition'),
                        company=comp,
                        company_website=c.get('company_website'),
                        company_niche=c.get('company_niche'),
                        location=c.get('location', 'India'),
                        linkedin_url=linkedin,
                        email=c.get('email'),
                        email_status=c.get('email_status', 'unverified'),
                        source_url=HR_DIRECTORY_URL,
                        created_at=now_utc
                    )
                    db.session.add(new_hr)
                    added += 1

            db.session.commit()
            if added > 0:
                sync_manager.log(f"Ingested {added} new HR recruiter contacts.")
            else:
                sync_manager.log("HR contacts are up to date (no new leads found).")
            return added
        except Exception as e:
            sync_manager.log(f"Error syncing HR contacts: {e}")
            return 0

    def run_full(self, target: str = 'all', mode: str = 'incremental', max_pages: int = None) -> dict:
        start_time = time.time()
        incremental = (mode == 'incremental')
        sync_manager.start(target=target, mode=mode)

        total_extracted = 0
        total_added = 0
        total_updated = 0
        hr_added = 0

        try:
            if target in ['india', 'all']:
                e, a, u = self.sync_india_jobs(incremental=incremental, max_pages=max_pages)
                total_extracted += e
                total_added += a
                total_updated += u

            if target in ['global', 'all']:
                e, a, u = self.sync_global_jobs(incremental=incremental, max_pages=max_pages)
                total_extracted += e
                total_added += a
                total_updated += u

            if target in ['wellfound', 'all']:
                e, a, u = self.sync_wellfound_jobs(incremental=incremental)
                total_extracted += e
                total_added += a
                total_updated += u

            if target in ['quick']:
                e, a, u = self.sync_india_jobs(incremental=False, max_pages=2)
                total_extracted += e
                total_added += a
                total_updated += u
                e2, a2, u2 = self.sync_global_jobs(incremental=False, max_pages=2)
                total_extracted += e2
                total_added += a2
                total_updated += u2
                e3, a3, u3 = self.sync_wellfound_jobs(incremental=False)
                total_extracted += e3
                total_added += a3
                total_updated += u3

            hr_added = self.sync_hr_contacts()

            duration = round(time.time() - start_time, 2)
            log_entry = ScrapeLog(
                status='completed',
                jobs_found=total_extracted,
                jobs_added=total_added,
                jobs_updated=total_updated,
                hr_contacts_added=hr_added,
                source=f"sync_{target}_{mode}",
                message=f"Sync ({mode}) finished in {duration}s. {total_added} new added, {total_updated} refreshed.",
                duration_sec=duration
            )
            db.session.add(log_entry)
            db.session.commit()

            sync_manager.finish(status='completed')
            return {
                'status': 'completed',
                'mode': mode,
                'duration': duration,
                'extracted': total_extracted,
                'added': total_added,
                'updated': total_updated,
                'hr_added': hr_added
            }

        except Exception as e:
            sync_manager.log(f"Pipeline failed: {e}")
            sync_manager.finish(status='failed', error=str(e))
            return {'status': 'failed', 'error': str(e)}

def start_background_sync(app, target: str = 'all', mode: str = 'incremental', max_pages: int = None):
    """
    Spawns background worker thread to execute sync without blocking HTTP server.
    """
    if sync_manager.is_running:
        return False, "A sync process is already running."

    def worker():
        with app.app_context():
            pipeline = ScraperPipeline()
            pipeline.run_full(target=target, mode=mode, max_pages=max_pages)

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    return True, f"Background sync '{target}' ({mode}) started successfully."

def main():
    parser = argparse.ArgumentParser(description="Run JobOrbit data ingestion pipeline")
    parser.add_argument('--target', choices=['india', 'global', 'wellfound', 'all', 'quick'], default='all', help="Target dataset")
    parser.add_argument('--mode', choices=['incremental', 'full'], default='incremental', help="Sync mode: incremental (new only) or full backfill")
    parser.add_argument('--pages', type=int, default=None, help="Max pagination pages to crawl")
    args = parser.parse_args()

    from app import create_app
    app = create_app()
    with app.app_context():
        pipeline = ScraperPipeline()
        res = pipeline.run_full(target=args.target, mode=args.mode, max_pages=args.pages)
        print("Sync Result:", res)

if __name__ == '__main__':
    main()
