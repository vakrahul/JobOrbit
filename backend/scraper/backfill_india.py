import os
import sys
import time
import requests
import concurrent.futures
from datetime import datetime, timezone

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from models import db, Job, generate_job_dedupe_key
from scraper.config import BASE_URL, REQUEST_HEADERS, REQUEST_TIMEOUT_SECONDS
from scraper.parser import parse_listing_page
from app import create_app

def fetch_and_parse_page(page_num: int):
    url = f"{BASE_URL}/jobs?days=all&page={page_num}"
    try:
        res = requests.get(url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
        if res.status_code == 200:
            jobs = parse_listing_page(res.text, url, default_region='India')
            return page_num, url, jobs
    except Exception as e:
        print(f"Error fetching page {page_num}: {e}")
    return page_num, url, []

def run_backfill(start_page: int = 69, end_page: int = 163):
    app = create_app()
    with app.app_context():
        print(f"Starting India backfill from page {start_page} to {end_page}...")
        pages_to_fetch = list(range(start_page, end_page + 1))
        now_utc = datetime.now(timezone.utc)
        total_added = 0
        total_updated = 0

        # Concurrently fetch pages with 5 workers
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_page = {executor.submit(fetch_and_parse_page, p): p for p in pages_to_fetch}
            
            # Sort as they complete
            for future in concurrent.futures.as_completed(future_to_page):
                page_num, url, jobs = future.result()
                if not jobs:
                    print(f"Page {page_num}: 0 jobs found")
                    continue

                page_added = 0
                page_updated = 0
                for j in jobs:
                    title, comp, loc = j['title'], j['company'], j['location']
                    d_key = generate_job_dedupe_key(title, comp, loc)
                    existing = Job.query.filter_by(dedupe_key=d_key).first()

                    if existing:
                        existing.is_new_today = j.get('is_new_today', existing.is_new_today)
                        existing.posted_date_text = j.get('posted_date_text', existing.posted_date_text)
                        existing.is_early_access = j.get('is_early_access', existing.is_early_access)
                        # Only update page_num if this page is lower/more recent
                        if existing.page_num is None or page_num < existing.page_num:
                            existing.page_num = page_num
                        if j.get('pay'):
                            existing.pay = j.get('pay')
                        existing.updated_at = now_utc
                        page_updated += 1
                    else:
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
                            apply_url=j.get('apply_url', ''),
                            apply_kind=j.get('apply_kind', 'link'),
                            detail_url=j.get('detail_url', ''),
                            source_url=url,
                            source='joborbit_india_feed',
                            page_num=page_num,
                            posted_at=now_utc,
                            created_at=now_utc
                        )
                        db.session.add(new_job)
                        page_added += 1

                db.session.commit()
                total_added += page_added
                total_updated += page_updated
                print(f"[Done] Page {page_num}: +{page_added} added, {page_updated} refreshed (Total added so far: {total_added})")

        total_india = Job.query.filter_by(region='India').count()
        total_all = Job.query.count()
        print(f"Backfill finished! Newly added: {total_added}. Total India jobs in DB: {total_india}. Total jobs: {total_all}")

if __name__ == '__main__':
    run_backfill(69, 163)
