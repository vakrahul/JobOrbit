"""
backend/scraper/scrape_all_hr_contacts.py
-----------------------------------------
Crawls all 77+ pages of CareerLift HR Directory (/api/hr?page={p})
with authenticated Bearer session, extracting all 1,837+ verified HR recruiter contacts:
- Name
- Job Title / Role
- Company
- Company Website
- Company Niche / Industry
- Location
- LinkedIn Profile URL
- Derived Corporate Email
"""
import os
import sys
import logging
import requests
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.hr import HRContact, generate_hr_dedupe_key
from scraper.hr_scraper import derive_email_patterns
from core.extensions import db
from app import create_app

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("HRScraperAll")

TOKEN = (
    "eyJhbGciOiJSUzI1NiIsImtpZCI6IjkwNGIwZjkxYmU2ZWIwODY3ZGFiYmFhYjU4N2RmYzJlMzNmMDBhMjQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVmFraXRpIFJhaHVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0psS3dQQTEwSi1fOGdVb29DT1F6QWxkSkpEN25yd2lKSUpndnl2elZiSGg3eHRqb3AzPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2NhcnJlcmxpZnQtNDY1MjgiLCJhdWQiOiJjYXJyZXJsaWZ0LTQ2NTI4IiwiYXV0aF90aW1lIjoxNzkxNjA0OTQ5LCJ1c2VyX2lkIjoiWXpaaTVheExMZVBRaGpFOVltUzRoTDM2RWN6MiIsInN1YiI6Ill6Wmk1YXhMTGVQUWhqRTlZbVM0aEwzNkVjejIiLCJpYXQiOjE3OTE2MzczMzIsImV4cCI6MTc5MTY0MDkzMiwiZW1haWwiOiJ2YWtpdGlyYWh1bEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExMzU2NjY4MzY2ODA4OTc3NjU3NCJdLCJlbWFpbCI6WyJ2YWtpdGlyYWh1bEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.Ql6BNFQi4vgbdiSczgiX9Ux-bVtiOyZjI-bubxj0kHGlaVY_RWKVSxcMn8g_EOyjKtyrNs_VwsB5Mj9gOJvI8w3LlglmDqjxpDvWET6o5lI4Kq4YjoXew90M0mUO0OHEOTWyxIS7HzDg8JiWAcoJQRkq69mAhDG2O7DRo7ogoY959c4f_DueR8aacpE3ifd_W02v_hhgnhsvanvLpefuVn1xDjLf_YLqx91jvDAxfwSqweY-dGIFWj8e1jjTkqBHNzpIJKJ9-BU6mXpNc_ipCBXpNHj6xoBApNmvwgTB6BhgT3lSaGR-sVeY8GiNnSJCOiCxsGyJNjerc5J7MACvpw"
)


def fetch_page(page: int):
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, */*'
    }
    url = f"https://www.carrerlift.in/api/hr?page={page}"
    try:
        r = requests.get(url, headers=headers, timeout=12)
        if r.status_code == 200:
            return page, r.json()
        else:
            logger.warning(f"Page {page} returned HTTP {r.status_code}")
            return page, None
    except Exception as e:
        logger.warning(f"Error fetching page {page}: {e}")
        return page, None


def scrape_all_hr():
    app = create_app()
    with app.app_context():
        # Step 1: Detect total page count
        logger.info("Connecting to CareerLift /api/hr to detect total page count...")
        _, initial = fetch_page(1)
        if not initial:
            logger.error("Failed to connect to /api/hr")
            return

        total_contacts = initial.get('total', 1837)
        page_count = initial.get('pageCount', 77)
        logger.info(f"Target identified: {total_contacts} HR recruiter contacts across {page_count} pages!")

        all_rows = list(initial.get('rows', []))

        # Step 2: Concurrently fetch pages 2 to page_count
        pages_to_fetch = list(range(2, page_count + 1))
        logger.info(f"Fetching remaining {len(pages_to_fetch)} pages concurrently with ThreadPool...")

        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {executor.submit(fetch_page, p): p for p in pages_to_fetch}
            for fut in as_completed(futures):
                p, data = fut.result()
                if data and data.get('rows'):
                    all_rows.extend(data['rows'])
                    if len(all_rows) % 200 < 25:
                        logger.info(f"Progress: {len(all_rows)}/{total_contacts} contacts fetched...")

        logger.info(f"Total contacts retrieved from API: {len(all_rows)}")

        # Step 3: Upsert into database
        inserted = 0
        updated = 0
        now_utc = datetime.now(timezone.utc)

        for row in all_rows:
            name = (row.get('name') or '').strip()
            company = (row.get('company') or '').strip()
            title = (row.get('job_title') or 'Talent Acquisition').strip()
            linkedin = (row.get('linkedin_url') or '').strip()
            website = (row.get('company_website') or '').strip()
            location = (row.get('location') or 'India').strip()
            niche = (row.get('company_niche') or '').strip()

            if not name or not company:
                continue

            d_key = generate_hr_dedupe_key(name, company, linkedin)
            existing = HRContact.query.filter_by(dedupe_key=d_key).first()

            # Derive corporate email if website exists
            derived_email = None
            email_status = 'unverified'
            if website:
                patterns = derive_email_patterns(name, website)
                if patterns:
                    derived_email = patterns[0]
                    email_status = 'pattern_derived'

            clean_linkedin = linkedin if ('linkedin.com' in linkedin.lower()) else f"https://www.linkedin.com/search/results/all/?keywords={requests.utils.quote(name + ' ' + company)}"

            if existing:
                existing.title = title
                existing.location = location
                existing.company_website = website
                existing.company_niche = niche
                if not existing.email and derived_email:
                    existing.email = derived_email
                    existing.email_status = email_status
                if not existing.linkedin_url:
                    existing.linkedin_url = clean_linkedin
                updated += 1
            else:
                contact = HRContact(
                    dedupe_key=d_key,
                    name=name,
                    title=title,
                    company=company,
                    company_website=website,
                    company_niche=niche,
                    location=location,
                    linkedin_url=clean_linkedin,
                    email=derived_email,
                    email_status=email_status,
                    source_url="https://joborbit.live/hr",
                    verified_at=now_utc,
                )
                db.session.add(contact)
                inserted += 1

        db.session.commit()
        total_in_db = HRContact.query.count()
        logger.info(f"=== HR Ingestion Complete ===")
        logger.info(f"New HR contacts inserted: {inserted}")
        logger.info(f"Existing contacts updated: {updated}")
        logger.info(f"Total HR Contacts in JobOrbit Database: {total_in_db}")


if __name__ == '__main__':
    scrape_all_hr()
