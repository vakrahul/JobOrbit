"""
backend/scraper/scrape_careerlift_premium.py
--------------------------------------------
Dedicated Authenticated Scraper for CareerLift Premium.
Uses the user's purchased CareerLift subscription (Firebase ID Bearer Token & Cookies)
to scrape unlocked premium jobs, corporate HR emails, direct WhatsApp hiring contacts,
and verified application links.

Usage:
    python backend/scraper/scrape_careerlift_premium.py --pages 5
"""
import os
import sys
import re
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

DEFAULT_TOKEN = os.getenv(
    "CAREERLIFT_TOKEN",
    "eyJhbGciOiJSUzI1NiIsImtpZCI6IjkwNGIwZjkxYmU2ZWIwODY3ZGFiYmFhYjU4N2RmYzJlMzNmMDBhMjQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVmFraXRpIFJhaHVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0psS3dQQTEwSi1fOGdVb29DT1F6QWxkSkpEN25yd2lKSUpndnl2elZiSGg3eHRqb3AzPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2NhcnJlcmxpZnQtNDY1MjgiLCJhdWQiOiJjYXJyZXJsaWZ0LTQ2NTI4IiwiYXV0aF90aW1lIjoxNzkxNjA0OTQ5LCJ1c2VyX2lkIjoiWXpaaTVheExMZVBRaGpFOVltUzRoTDM2RWN6MiIsInN1YiI6Ill6Wmk1YXhMTGVQUWhqRTlZbVM0aEwzNkVjejIiLCJpYXQiOjE3OTE2MzczMzIsImV4cCI6MTc5MTY0MDkzMiwiZW1haWwiOiJ2YWtpdGlyYWh1bEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExMzU2NjY4MzY2ODA4OTc3NjU3NCJdLCJlbWFpbCI6WyJ2YWtpdGlyYWh1bEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.Ql6BNFQi4vgbdiSczgiX9Ux-bVtiOyZjI-bubxj0kHGlaVY_RWKVSxcMn8g_EOyjKtyrNs_VwsB5Mj9gOJvI8w3LlglmDqjxpDvWET6o5lI4Kq4YjoXew90M0mUO0OHEOTWyxIS7HzDg8JiWAcoJQRkq69mAhDG2O7DRo7ogoY959c4f_DueR8aacpE3ifd_W02v_hhgnhsvanvLpefuVn1xDjLf_YLqx91jvDAxfwSqweY-dGIFWj8e1jjTkqBHNzpIJKJ9-BU6mXpNc_ipCBXpNHj6xoBApNmvwgTB6BhgT3lSaGR-sVeY8GiNnSJCOiCxsGyJNjerc5J7MACvpw"
)

DEFAULT_COOKIE = os.getenv(
    "CAREERLIFT_COOKIE",
    "_ga=GA1.1.341209868.1790141182; ext_name=ojplmecpdpgccookcobabopnaifgidhf; g_state={\"i_l\":0,\"i_ll\":1791604903332,\"i_e\":{\"enable_itp_optimization\":24},\"i_et\":1791604903332,\"i_b\":\"HAFNNAY3DvGv3pesXK0Gp03u6nUtTLYqESA2e8ddQpo\"}; _ga_FRMVZ6H187=GS2.1.s1791637333$o53$g1$t1791637409$j59$l0$h0"
)


def extract_real_apply_from_slug(session, slug_url: str):
    """
    Fetches the dedicated job slug page on CareerLift with authentication
    and extracts the true external application destination (email, ATS, whatsapp, or form).
    """
    try:
        resp = session.get(slug_url, timeout=10)
        if resp.status_code != 200:
            return None, None

        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # 1. Look for direct apply anchors
        for a in soup.find_all('a', href=True):
            href = a['href'].strip()
            txt = a.get_text().strip().lower()
            if 'apply' in txt:
                if href.startswith('mailto:') or href.startswith('http') and 'carrerlift' not in href:
                    return href, 'email' if href.startswith('mailto:') else 'link'
            if href.startswith('mailto:'):
                return href, 'email'

        # 2. Extract description from container
        desc_text = None
        for h in soup.find_all(['h2', 'h3']):
            h_text = h.get_text().lower()
            if 'about' in h_text or 'role' in h_text or 'description' in h_text:
                container = h.parent
                raw = container.get_text(separator='\n', strip=True)
                for cut_off in ['How well do you fit', 'Share on WhatsApp', 'Similar roles', 'Report listing']:
                    if cut_off in raw:
                        raw = raw.split(cut_off)[0]
                desc_text = raw.strip()
                break

        return None, desc_text
    except Exception as e:
        logger.warning(f"Error fetching slug {slug_url}: {e}")
        return None, None


def run_premium_scrape(token: str = None, cookie: str = None, max_pages: int = 5):
    app = create_app()
    with app.app_context():
        active_token = token or DEFAULT_TOKEN
        active_cookie = cookie or DEFAULT_COOKIE

        base_url = settings.SCRAPER_BASE_URL.rstrip('/')
        session = requests.Session()
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Referer": f"{base_url}/jobs"
        }
        if active_token:
            headers["Authorization"] = f"Bearer {active_token}"
        if active_cookie:
            headers["Cookie"] = active_cookie
        session.headers.update(headers)

        # Verify premium session status
        try:
            prem_check = session.get(f"{base_url}/api/premium", timeout=10)
            if prem_check.status_code == 200:
                p_data = prem_check.json()
                logger.info(f"Verified Active Premium Session: {p_data.get('premium')}, Valid Until: {p_data.get('expiresAt')}")
            else:
                logger.warning(f"Premium check returned HTTP {prem_check.status_code}")
        except Exception as e:
            logger.warning(f"Could not check /api/premium: {e}")

        total_scraped = 0
        total_new = 0
        total_updated = 0
        now_utc = datetime.now(timezone.utc)

        for page in range(1, max_pages + 1):
            url = f"{base_url}/jobs?days=all&page={page}"
            logger.info(f"--- Crawling Page {page}/{max_pages}: {url} ---")
            try:
                resp = session.get(url, timeout=15)
                if resp.status_code != 200:
                    logger.warning(f"HTTP {resp.status_code} on page {page}")
                    continue

                jobs_parsed = parse_listing_page(resp.text, url, default_region='India')
                soup = BeautifulSoup(resp.text, 'html.parser')

                # Extract individual job slugs from current page
                slugs_map = {}
                for a in soup.find_all('a', href=True):
                    h = a['href']
                    if h.startswith('/jobs/') and len(h) > 15:
                        slug_name = h.split('/jobs/')[1].split('?')[0].split('#')[0]
                        slugs_map[slug_name] = f"{base_url}{h}"

                logger.info(f"Page {page}: Found {len(jobs_parsed)} roles, {len(slugs_map)} detail slugs")

                for j in jobs_parsed:
                    total_scraped += 1
                    title = (j.get('title') or '').strip()
                    company = (j.get('company') or '').strip()
                    location = (j.get('location') or 'Remote / India').strip()

                    if not title or not company:
                        continue

                    d_key = generate_job_dedupe_key(title, company, location)
                    existing = Job.query.filter_by(dedupe_key=d_key).first()

                    # Find matching slug for this role
                    c_clean = re.sub(r'[^a-z0-9]', '', company.lower())
                    matching_slug_url = None
                    for s_name, s_url in slugs_map.items():
                        if c_clean and c_clean in s_name.lower():
                            matching_slug_url = s_url
                            break

                    real_apply_url = None
                    real_kind = j.get('apply_kind', 'link')
                    rich_desc = j.get('description') or j.get('snippet')

                    if matching_slug_url:
                        found_apply, found_desc = extract_real_apply_from_slug(session, matching_slug_url)
                        if found_apply:
                            real_apply_url = found_apply
                            if found_apply.startswith('mailto:'):
                                real_kind = 'email'
                        if found_desc and len(found_desc) > len(rich_desc or ''):
                            rich_desc = found_desc

                    # Fallback sanitized apply
                    if not real_apply_url:
                        raw_apply = j.get('apply_url') or j.get('detail_url') or ''
                        real_apply_url = sanitize_job_url(raw_apply, company, title)

                    if existing:
                        existing.is_new_today = True
                        existing.is_early_access = True
                        existing.posted_date_text = 'Today'
                        if real_apply_url and ('mailto:' in real_apply_url or 'linkedin.com' not in real_apply_url):
                            existing.apply_url = real_apply_url
                            existing.apply_kind = real_kind
                        if j.get('pay'):
                            existing.pay = j.get('pay')
                        if rich_desc and len(rich_desc) > len(existing.description or ''):
                            existing.description = rich_desc
                        total_updated += 1
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
                            description=rich_desc or j.get('snippet', ''),
                            apply_url=real_apply_url,
                            apply_kind=real_kind,
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
        logger.info(f"New VIP roles inserted: {total_new}")
        logger.info(f"Existing roles enriched with verified contacts: {total_updated}")
        return {
            'status': 'success',
            'scraped': total_scraped,
            'new_jobs': total_new,
            'updated_jobs': total_updated
        }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Scrape CareerLift with Premium Authentication")
    parser.add_argument('--token', type=str, default=None, help="CareerLift Bearer token")
    parser.add_argument('--cookie', type=str, default=None, help="CareerLift cookie string")
    parser.add_argument('--pages', type=int, default=5, help="Number of pages to scrape (default 5)")
    args = parser.parse_args()

    run_premium_scrape(token=args.token, cookie=args.cookie, max_pages=args.pages)
