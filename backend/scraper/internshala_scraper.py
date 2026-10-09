"""
scraper/internshala_scraper.py
--------------------------------
Internshala Tech & Remote Internship Scraper.
100% Public — Zero Login or Cookies Required.

Extracts:
- Internship Title (SDE, Web Dev, AI/ML, Python, Cloud)
- Company Name
- Location (Work From Home / Remote / Bangalore / etc.)
- Stipend in INR (e.g. ₹10,000 - ₹25,000 /month)
- Duration
- Application / Detail URL
- Direct CSV Export for Google Sheets / Excel
- Optional JobOrbit Database Sync
"""

import sys
import os
import re
import csv
import json
import time
import random
import logging
import argparse
from typing import List, Dict, Any

import requests
from bs4 import BeautifulSoup

# Ensure Windows terminal prints UTF-8 (Rupee symbol ₹) without charmap error
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Setup paths
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("InternshalaScraper")


class InternshalaScraper:
    BASE_URL = "https://internshala.com"
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/128.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    CATEGORY_URLS = {
        "cs": "https://internshala.com/internships/computer-science-internship/",
        "remote": "https://internshala.com/internships/work-from-home-computer-science-internships/",
        "python": "https://internshala.com/internships/python-django-internship/",
        "web-dev": "https://internshala.com/internships/web-development-internship/",
        "ai-ml": "https://internshala.com/internships/artificial-intelligence-ai-internship/",
        "all": "https://internshala.com/internships/work-from-home-computer-science-internships/",
    }

    def __init__(self, timeout: int = 12):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)

    def scrape_internships(self, category: str = "remote", limit: int = 20) -> List[Dict[str, Any]]:
        target_url = self.CATEGORY_URLS.get(category.lower(), self.CATEGORY_URLS["remote"])
        logger.info(f"Scraping Internshala category '{category}': {target_url}")

        internships: List[Dict[str, Any]] = []
        page = 1

        while len(internships) < limit and page <= 3:
            page_url = f"{target_url}page-{page}/" if page > 1 else target_url
            try:
                r = self.session.get(page_url, timeout=self.timeout)
                if r.status_code != 200:
                    logger.warning(f"Failed to fetch {page_url} (HTTP {r.status_code})")
                    break

                soup = BeautifulSoup(r.text, "html.parser")
                cards = soup.find_all("div", class_="internship_meta")
                if not cards:
                    break

                for c in cards:
                    if len(internships) >= limit:
                        break

                    # Title & Link
                    link_tag = c.find("a", class_="job-title-href")
                    title = link_tag.get_text(strip=True) if link_tag else "Software Engineering Intern"
                    href = link_tag.get("href") if link_tag else ""
                    apply_url = f"{self.BASE_URL}{href}" if href.startswith("/") else href

                    # Company
                    comp_tag = c.find("p", class_="company-name") or c.find("a", class_="link_display_like_text")
                    company = comp_tag.get_text(strip=True) if comp_tag else "Tech Startup"

                    # Location
                    loc_tag = c.find("a", class_="location_link") or c.find(class_=lambda x: x and "row-1-item" in x)
                    location = loc_tag.get_text(strip=True) if loc_tag else "Work From Home / Remote"

                    # Stipend
                    stipend_tag = c.find("span", class_="stipend")
                    stipend = stipend_tag.get_text(strip=True) if stipend_tag else "Competitive / Performance Based"

                    # Duration
                    duration = "2-6 Months"
                    detail_rows = c.find_all("div", class_="row-1-item")
                    for row in detail_rows:
                        text = row.get_text(strip=True)
                        if "Month" in text or "Week" in text:
                            duration = text
                            break

                    internships.append({
                        "id": f"is-{len(internships)+1}",
                        "title": title,
                        "company": company,
                        "location": location,
                        "stipend": stipend,
                        "duration": duration,
                        "job_type": "Internship",
                        "apply_url": apply_url,
                        "source": "internshala",
                    })

                page += 1
                time.sleep(random.uniform(1.0, 2.0))

            except Exception as e:
                logger.error(f"Error scraping Internshala: {e}")
                break

        logger.info(f"Extracted {len(internships)} internships from Internshala.")
        return internships

    @staticmethod
    def export_to_csv(items: List[Dict[str, Any]], filepath: str):
        """Exports data to CSV formatted perfectly for Google Sheets & Excel."""
        fieldnames = ["Title", "Company", "Location", "Stipend", "Duration", "Job Type", "Apply URL", "Source"]
        with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for item in items:
                writer.writerow({
                    "Title": item.get("title", ""),
                    "Company": item.get("company", ""),
                    "Location": item.get("location", ""),
                    "Stipend": item.get("stipend", ""),
                    "Duration": item.get("duration", ""),
                    "Job Type": item.get("job_type", "Internship"),
                    "Apply URL": item.get("apply_url", ""),
                    "Source": item.get("source", "internshala"),
                })
        logger.info(f"Saved Google Sheets CSV to: {filepath}")

    @staticmethod
    def sync_to_database(items: List[Dict[str, Any]]) -> Dict[str, int]:
        """Syncs Internshala openings directly into JobOrbit SQLite database."""
        try:
            from app import create_app
            from core.extensions import db
            from models.job import Job, generate_job_dedupe_key

            app = create_app({"TESTING": True})
            added_jobs = 0

            with app.app_context():
                for item in items:
                    title = item.get("title", "Tech Intern")
                    company = item.get("company", "Company")
                    location = item.get("location", "Remote")
                    apply_url = item.get("apply_url", "")
                    stipend = item.get("stipend", "Competitive")

                    dedupe_key = generate_job_dedupe_key(title, company, location)
                    existing = Job.query.filter_by(dedupe_key=dedupe_key).first()
                    if not existing:
                        new_job = Job(
                            dedupe_key=dedupe_key,
                            title=title,
                            company=company,
                            location=location,
                            region="India",
                            job_type="Internship",
                            pay=stipend,
                            is_new_today=True,
                            posted_date_text="Active",
                            is_early_access=False,
                            snippet=f"{title} at {company} ({location}). Stipend: {stipend}, Duration: {item.get('duration')}.",
                            description=f"Internship Opportunity at {company}. Apply directly on Internshala portal.",
                            apply_url=apply_url,
                            source_url=apply_url,
                            source="internshala",
                        )
                        db.session.add(new_job)
                        added_jobs += 1

                db.session.commit()
                return {"added_jobs": added_jobs}
        except Exception as e:
            logger.error(f"Error syncing Internshala to DB: {e}")
            return {"error": str(e), "added_jobs": 0}


def main():
    parser = argparse.ArgumentParser(description="Internshala Internship Scraper")
    parser.add_argument("--category", "-c", default="remote", choices=["remote", "cs", "python", "web-dev", "ai-ml", "all"])
    parser.add_argument("--limit", "-l", type=int, default=20)
    parser.add_argument("--save-csv", "-o", help="CSV path for Google Sheets export")
    parser.add_argument("--sync-db", action="store_true", help="Sync into JobOrbit database")

    args = parser.parse_args()

    scraper = InternshalaScraper()
    results = scraper.scrape_internships(category=args.category, limit=args.limit)

    print("\n" + "=" * 65)
    print(f"🎓 INTERNSHALA SCRAPER RUN ({len(results)} Internships)")
    print(f"Category: {args.category.upper()} | Limit: {args.limit}")
    print("=" * 65 + "\n")

    for idx, item in enumerate(results, 1):
        print(f"[{idx}] {item['title']} @ {item['company']}")
        print(f"    📍 Location: {item['location']} | 💰 Stipend: {item['stipend']}")
        print(f"    ⏳ Duration: {item['duration']}")
        print(f"    🔗 Apply: {item['apply_url']}")
        print("-" * 65)

    if args.save_csv:
        scraper.export_to_csv(results, args.save_csv)
        print(f"\n📊 Google Sheets CSV exported to: {args.save_csv}")

    if args.sync_db:
        sync_res = scraper.sync_to_database(results)
        print(f"✅ Ingested +{sync_res.get('added_jobs', 0)} new internships into JobOrbit DB!")


if __name__ == "__main__":
    main()
