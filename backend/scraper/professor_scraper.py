import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import requests
from bs4 import BeautifulSoup
import re
import hashlib
import time
import logging
from scraper.config import REQUEST_HEADERS
from models import db, ProfessorContact
from core.config import settings

logger = logging.getLogger(__name__)

def generate_prof_dedupe_key(name: str, institute: str, email: str) -> str:
    raw = f"{name.strip().lower()}|{institute.strip().lower()}|{email.strip().lower()}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def clean_text(text: str) -> str:
    if not text:
        return ''
    return text.replace('\xa0', ' ').replace('', '').strip()

def parse_research_page(html: str) -> list[dict]:
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    seen_emails = set()

    # Find professor cards: rounded-xl with border and mailto link
    for card in soup.find_all('div', class_=re.compile(r'rounded-xl.*border.*p-5|border.*bg-raised.*p-5')):
        mailto = card.find('a', href=re.compile(r'^mailto:'))
        if not mailto:
            continue
            
        email = mailto['href'].replace('mailto:', '').strip().lower()
        if not email or '@' not in email or any(d in email for d in ['admin@', 'noreply@', 'example.com']):
            continue

        if email in seen_emails:
            continue
        seen_emails.add(email)

        # Name
        h2 = card.find('h2')
        if not h2:
            continue
        raw_name = h2.get_text(strip=True)
        if raw_name.startswith('Email'):
            continue
        name = clean_text(raw_name)
        if not name or len(name) > 80:
            continue

        # Department
        dept_tag = h2.find_next_sibling('p')
        department = clean_text(dept_tag.get_text(strip=True)) if dept_tag else 'Engineering & Sciences'

        # Institute
        inst_span = card.find('span', class_=re.compile(r'truncate'))
        institute = clean_text(inst_span.get_text(strip=True)) if inst_span else ''
        if not institute or len(institute) > 50:
            match = re.search(r'(IIT\s+[A-Za-z]+|IISc|IIIT\s+[A-Za-z]+|NIT\s+[A-Za-z]+)', card.get_text())
            institute = match.group(1).strip() if match else 'IIT'

        # Research areas
        research_areas = ''
        areas_h3 = card.find(lambda t: t.name in ['h3', 'h4', 'span'] and 'research' in t.get_text(strip=True).lower())
        if areas_h3:
            areas_p = areas_h3.find_next_sibling('p')
            if areas_p:
                research_areas = clean_text(areas_p.get_text(strip=True))

        # Personal / lab website if present
        website_url = None
        for a in card.find_all('a', href=True):
            href = a['href']
            base_domain = settings.SCRAPER_BASE_URL.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
            if href.startswith('http') and base_domain not in href and 'mailto:' not in href and 'linkedin' not in href:
                website_url = href
                break

        results.append({
            'name': name,
            'institute': institute,
            'department': department,
            'research_areas': research_areas,
            'email': email,
            'website_url': website_url
        })

    return results

def scrape_professors(app, max_pages: int = 15):
    """
    Scrapes professor contacts from faculty research directory and saves to database.
    """
    with app.app_context():
        total_added = 0
        total_existing = 0

        base_url = settings.SCRAPER_BASE_URL.rstrip('/')
        for page in range(1, max_pages + 1):
            url = f"{base_url}/research?page={page}"
            try:
                resp = requests.get(url, headers=REQUEST_HEADERS, timeout=15)
                if resp.status_code != 200:
                    print(f"Page {page} returned status {resp.status_code}, stopping.")
                    break

                profs = parse_research_page(resp.text)
                if not profs:
                    print(f"No profs parsed on page {page}, stopping.")
                    break

                page_added = 0
                for p in profs:
                    dedupe_key = generate_prof_dedupe_key(p['name'], p['institute'], p['email'])
                    existing = ProfessorContact.query.filter_by(dedupe_key=dedupe_key).first()
                    if not existing:
                        prof = ProfessorContact(
                            dedupe_key=dedupe_key,
                            name=p['name'],
                            institute=p['institute'],
                            department=p['department'],
                            research_areas=p['research_areas'],
                            email=p['email'],
                            website_url=p['website_url'],
                            source_url=url
                        )
                        db.session.add(prof)
                        page_added += 1
                        total_added += 1
                    else:
                        # Update research areas if empty
                        if not existing.research_areas and p['research_areas']:
                            existing.research_areas = p['research_areas']
                        total_existing += 1

                db.session.commit()
                print(f"[Research Ingestion] Page {page}: added {page_added}, existing {len(profs) - page_added}")
                time.sleep(0.3)
            except Exception as e:
                print(f"Error scraping research page {page}: {e}")

        print(f"Research Ingestion Complete: {total_added} added, {total_existing} existing. Total in DB: {ProfessorContact.query.count()}")
        return total_added

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    scrape_professors(app, max_pages=15)
