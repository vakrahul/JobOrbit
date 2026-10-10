"""
backend/scraper/scrape_careerlift_premium.py
--------------------------------------------
Dedicated Authenticated Scraper for CareerLift Premium.
Uses the user's purchased CareerLift subscription session cookie to scrape:
1. Premium/exclusive job listings
2. Real direct application links (Greenhouse, Lever, Workday, employer portals)
3. Full job descriptions & requirements

Usage:
    python backend/scraper/scrape_careerlift_premium.py --cookie "your_cookie_here" --pages 5
    OR set CAREERLIFT_COOKIE in .env and run:
    python backend/scraper/scrape_careerlift_premium.py
"""
import os
import sys
import argparse
import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.config import settings
from core.url_sanitizer import sanitize_job_url
from scraper.parser import parse_listing_page
from models.job import Job, generate_job_dedupe_key
from core.extensions import db
from app import create_app

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("CareerLiftPremiumScraper")


def run_premium_scrape(cookie: str = None, max_pages: int = 5):
    app = create_app()
    with app.app_context():
        active_cookie = cookie or settings.CAREERLIFT_COOKIE or os.getenv("CAREERLIFT_COOKIE")
        
        if not active_cookie:
            logger.warning("No CAREERLIFT_COOKIE found! Requests will be anonymous/free tier.")
            logger.warning("Pass --cookie '<cookie_string>' or set CAREERLIFT_COOKIE in .env to access premium listings.")
        else:
            logger.info("Authenticated session active using CareerLift Premium Cookie.")

        base_url = settings.SCRAPER_BASE_URL.rstrip('/')
        session = requests.Session()
        headers = {
            "User-Agent": settings.SCRAPER_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
        }
        if active_cookie:
            headers["Cookie"] = active_cookie
        session.headers.update(headers)

        total_scraped = 0
        total_new = 0
        now_utc = datetime.now(timezone.utc)

        for page in range(1, max_pages + 1):
            url = f"{base_url}/jobs?days=all&page={page}"
            logger.info(f"Fetching page {page}/{max_pages}: {url}")
            try:
                resp = session.get(url, timeout=15)
                if resp.status_code != 200:
                    logger.warning(f"HTTP {resp.status_code} on page {page}")
                    continue

                jobs_parsed = parse_listing_page(resp.text, url, default_region='India')
                logger.info(f"Page {page} parsed: {len(jobs_parsed)} roles found")

                for j in jobs_parsed:
                    total_scraped += 1
                    title = (j.get('title') or '').strip()
                    company = (j.get('company') or '').strip()
                    location = (j.get('location') or 'Remote / India').strip()

                    if not title or not company:
                        continue

                    d_key = generate_job_dedupe_key(title, company, location)
                    existing = Job.query.filter_by(dedupe_key=d_key).first()

                    # Resolve authentic direct application link
                    raw_apply = j.get('apply_url') or j.get('detail_url') or ''
                    clean_apply = sanitize_job_url(raw_apply, company, title)

                    if existing:
                        # Update with premium unlocked details
                        if clean_apply and not existing.apply_url:
                            existing.apply_url = clean_apply
                        existing.is_new_today = True
                        existing.is_early_access = True
                        existing.posted_date_text = 'Today'
                        if j.get('pay'):
                            existing.pay = j.get('pay')
                        if j.get('description') and len(j.get('description')) > len(existing.description or ''):
                            existing.description = j.get('description')
                    else:
                        new_job = Job(
                            dedupe_key=d_key,
                            title=title,
                            company=company,
                            location=location,
                            region='India',
                            job_type=j.get('type', 'Full-time'),
                            pay=j.get('pay', 'Competitive'),
                            batch=j.get('batch'),
                            is_new_today=True,
                            posted_date_text='Today',
                            is_early_access=True,
                            snippet=j.get('snippet', ''),
                            description=j.get('description', ''),
                            apply_url=clean_apply,
                            apply_kind='link',
                            detail_url=f"/jobs/{d_key[:12]}",
                            source_url=url,
                            source='careerlift_premium',
                            page_num=page,
                            posted_at=now_utc,
                        )
                        db.session.add(new_job)
                        total_new += 1

                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error scraping page {page}: {e}")

        logger.info(f"=== Scraping Complete ===")
        logger.info(f"Total roles inspected: {total_scraped}")
        logger.info(f"New premium roles inserted: {total_new}")
        return {
            'status': 'success',
            'scraped': total_scraped,
            'new_jobs': total_new
        }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Scrape CareerLift with Premium Authentication")
    parser.add_argument('--cookie', type=str, default=None, help="CareerLift session cookie string")
    parser.add_argument('--pages', type=int, default=5, help="Number of pages to scrape (default 5)")
    args = parser.parse_args()

    run_premium_scrape(cookie=args.cookie, max_pages=args.pages)
