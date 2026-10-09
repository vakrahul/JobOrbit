"""
scraper/x_scraper.py
--------------------
X (Twitter) Tech & Recruiter Hiring Scraper Bot.
Uses authenticated X session cookies (`auth_token`, `ct0`).

Capabilities:
- Searches X for live hiring announcements from Indian founders, recruiters, and engineering leads:
  e.g. `(hiring OR intern OR SDE) (remote OR bangalore OR india)`
- Extracts: Author Name, @handle, Tweet text, Posted timestamp, Application URLs, Recruiter emails.
- Exports directly to CSV for Google Sheets & Excel.
- Ingests into JobOrbit SQLite Database (`jobs` & `hr_contacts`).
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
import urllib.parse
from typing import List, Dict, Any, Optional

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Ensure Windows terminal prints UTF-8 without charmap errors
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Setup paths & environment
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("XScraper")


class XScraper:
    DEFAULT_HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/128.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "DNT": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
    }

    def __init__(self, auth_token: Optional[str] = None, ct0: Optional[str] = None, timeout: int = 15):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(self.DEFAULT_HEADERS)

        self.auth_token = (auth_token or os.getenv("X_AUTH_TOKEN", "")).strip()
        self.ct0 = (ct0 or os.getenv("X_CT0", "")).strip()

        if self.auth_token:
            self.session.cookies.set("auth_token", self.auth_token, domain=".x.com")
            if self.ct0:
                self.session.cookies.set("ct0", self.ct0, domain=".x.com")
                self.session.headers.update({"x-csrf-token": self.ct0})
            logger.info("X (Twitter) authenticated session active.")
        else:
            logger.warning("No X auth_token provided. Requests may be blocked by X login wall.")

    def parse_hiring_details(self, text: str) -> Dict[str, Any]:
        """Extracts emails, role titles, and batches from tweet text."""
        raw_emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
        emails = list(dict.fromkeys([e.strip().rstrip(".") for e in raw_emails if not e.endswith(".png") and not e.endswith(".jpg")]))

        # Roles
        role = "Software Engineer / Tech Role"
        for common_role in [
            "SDE Intern", "Frontend Intern", "Backend Intern", "AI Engineer",
            "Machine Learning", "Full Stack Developer", "Cloud Engineer", "DevOps", "Data Analyst"
        ]:
            if common_role.lower() in text.lower():
                role = common_role
                break

        # Location
        loc = "Remote / India"
        for l in ["Bangalore", "Bengaluru", "Hyderabad", "Pune", "Delhi", "Noida", "Gurugram", "Remote"]:
            if l.lower() in text.lower():
                loc = l
                break

        return {"emails": emails, "role": role, "location": loc}

    def search_hiring_tweets(self, query: str = "hiring (sde OR intern) (remote OR bangalore OR india)", limit: int = 20) -> List[Dict[str, Any]]:
        """
        Searches X for live hiring posts and extracts tweet details.
        """
        logger.info(f"Searching X for: '{query}' (limit={limit})")
        encoded_query = requests.utils.quote(query)
        search_url = f"https://x.com/search?q={encoded_query}&f=live"

        try:
            r = self.session.get(search_url, timeout=self.timeout)
            if r.status_code != 200:
                logger.error(f"X search returned HTTP {r.status_code}")
                return []

            soup = BeautifulSoup(r.text, "html.parser")
            tweets = []

            # 1. Inspect __INITIAL_STATE__ script
            for s in soup.find_all("script"):
                content = s.string or ""
                if "__INITIAL_STATE__" in content:
                    m = re.search(r"window\.__INITIAL_STATE__\s*=\s*(\{.*?\});", content, re.DOTALL)
                    if m:
                        try:
                            data = json.loads(m.group(1))
                            entities = data.get("entities", {})
                            tw_dict = entities.get("tweets", {})
                            users_dict = entities.get("users", {})
                            for tid, tw in tw_dict.items():
                                if len(tweets) >= limit:
                                    break
                                full_text = tw.get("full_text", "")
                                if not full_text or len(full_text) < 20:
                                    continue
                                user_info = users_dict.get(tw.get("user_id_str"), {})
                                screen_name = user_info.get("screen_name", "user")
                                name = user_info.get("name", "Recruiter")
                                tweet_url = f"https://x.com/{screen_name}/status/{tid}"

                                meta = self.parse_hiring_details(full_text)

                                tweets.append({
                                    "id": f"x-{tid}",
                                    "title": meta["role"],
                                    "company": f"@{screen_name} ({name})",
                                    "location": meta["location"],
                                    "author": f"{name} (@{screen_name})",
                                    "author_handle": f"@{screen_name}",
                                    "tweet_url": tweet_url,
                                    "apply_url": tweet_url,
                                    "posted_date": tw.get("created_at", "Recently"),
                                    "emails": meta["emails"],
                                    "text": full_text,
                                    "snippet": full_text[:250],
                                    "source": "x_twitter",
                                })
                        except Exception as e:
                            logger.debug(f"State parsing note: {e}")

            # 2. Fallback: Parse rendered article tags if SSR delivered them
            if not tweets:
                articles = soup.find_all("article")
                for idx, art in enumerate(articles[:limit]):
                    text = art.get_text(" ", strip=True)
                    if len(text) < 30:
                        continue
                    meta = self.parse_hiring_details(text)
                    tweets.append({
                        "id": f"x-art-{idx+1}",
                        "title": meta["role"],
                        "company": "X Recruiter Post",
                        "location": meta["location"],
                        "author": "X User",
                        "tweet_url": f"https://x.com/search?q={encoded_query}",
                        "apply_url": f"https://x.com/search?q={encoded_query}",
                        "posted_date": "Recently",
                        "emails": meta["emails"],
                        "text": text,
                        "snippet": text[:250],
                        "source": "x_twitter",
                    })

            logger.info(f"Extracted {len(tweets)} hiring posts from X.")
            return tweets

        except Exception as e:
            logger.error(f"Error querying X: {e}", exc_info=True)
            return []

    @staticmethod
    def export_to_csv(items: List[Dict[str, Any]], filepath: str):
        """Exports X posts into a clean Google Sheets / Excel CSV."""
        fieldnames = ["Title", "Company / Handle", "Location", "Posted Date", "Recruiter Emails", "Tweet URL", "Tweet Text", "Source"]
        with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for item in items:
                writer.writerow({
                    "Title": item.get("title", "Tech Opportunity"),
                    "Company / Handle": item.get("company", ""),
                    "Location": item.get("location", "Remote / India"),
                    "Posted Date": item.get("posted_date", "Recently"),
                    "Recruiter Emails": ", ".join(item.get("emails", [])),
                    "Tweet URL": item.get("tweet_url", ""),
                    "Tweet Text": item.get("snippet", ""),
                    "Source": "x_twitter",
                })
        logger.info(f"Saved Google Sheets CSV to: {filepath}")

    @staticmethod
    def sync_to_database(items: List[Dict[str, Any]]) -> Dict[str, int]:
        """Syncs X hiring posts into JobOrbit database."""
        try:
            from app import create_app
            from core.extensions import db
            from models.job import Job, generate_job_dedupe_key
            from models.hr import HRContact, generate_hr_dedupe_key

            app = create_app({"TESTING": True})
            added_jobs = 0
            added_hrs = 0

            with app.app_context():
                for item in items:
                    title = item.get("title", "Tech Role")
                    company = item.get("company", "X Recruiter")
                    location = item.get("location", "Remote / India")
                    apply_url = item.get("tweet_url", "")
                    text = item.get("text", "")
                    emails = item.get("emails", [])

                    dedupe_key = generate_job_dedupe_key(title, company, location)
                    existing = Job.query.filter_by(dedupe_key=dedupe_key).first()
                    if not existing:
                        new_job = Job(
                            dedupe_key=dedupe_key,
                            title=title,
                            company=company,
                            location=location,
                            region="India",
                            job_type="Internship" if "intern" in title.lower() else "Full-time",
                            pay="Competitive",
                            is_new_today=True,
                            posted_date_text="Active on X",
                            is_early_access=True,
                            snippet=text[:300],
                            description=text,
                            apply_url=apply_url,
                            source_url=apply_url,
                            source="x_twitter",
                        )
                        db.session.add(new_job)
                        added_jobs += 1

                    for email in emails:
                        hr_key = generate_hr_dedupe_key(company, "X Community")
                        existing_hr = HRContact.query.filter_by(dedupe_key=hr_key).first()
                        if not existing_hr:
                            new_hr = HRContact(
                                dedupe_key=hr_key,
                                name=item.get("author", "Tech Recruiter"),
                                title="Hiring Lead on X",
                                company=company,
                                location=location,
                                email=email,
                                email_status="verified",
                                source_url=apply_url,
                            )
                            db.session.add(new_hr)
                            added_hrs += 1

                db.session.commit()
                return {"added_jobs": added_jobs, "added_hrs": added_hrs}
        except Exception as e:
            logger.error(f"Error syncing X posts to DB: {e}")
            return {"error": str(e), "added_jobs": 0, "added_hrs": 0}


def main():
    parser = argparse.ArgumentParser(description="X (Twitter) Tech Hiring Scraper")
    parser.add_argument(
        "--query",
        "-q",
        default="hiring (sde OR intern OR engineer) (remote OR bangalore OR india)",
        help="Search query on X",
    )
    parser.add_argument("--limit", "-l", type=int, default=20)
    parser.add_argument("--save-csv", "-o", help="File path to save the Google Sheets CSV")
    parser.add_argument("--sync-db", action="store_true", help="Sync into JobOrbit database")

    args = parser.parse_args()

    scraper = XScraper()
    results = scraper.search_hiring_tweets(query=args.query, limit=args.limit)

    print("\n" + "=" * 65)
    print(f"🐦 X (TWITTER) TECH HIRING RUN ({len(results)} Posts)")
    print(f"Query: '{args.query}' | Limit: {args.limit}")
    print("=" * 65 + "\n")

    for idx, item in enumerate(results, 1):
        print(f"[{idx}] {item['title']} by {item['author']}")
        print(f"    📍 Location: {item['location']} | 📅 Posted: {item['posted_date']}")
        print(f"    🔗 Tweet: {item['tweet_url']}")
        if item.get("emails"):
            print(f"    📩 Recruiter Email: {', '.join(item['emails'])}")
        print(f"    💬 Content: {item['snippet'][:120]}...")
        print("-" * 65)

    if args.save_csv:
        scraper.export_to_csv(results, args.save_csv)
        print(f"\n📊 Google Sheets CSV exported to: {args.save_csv}")

    if args.sync_db:
        sync_res = scraper.sync_to_database(results)
        print(f"✅ Ingested +{sync_res.get('added_jobs', 0)} jobs and +{sync_res.get('added_hrs', 0)} HR contacts into JobOrbit DB!")


if __name__ == "__main__":
    main()
