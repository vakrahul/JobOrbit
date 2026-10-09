"""
scraper/linkedin_scraper.py
----------------------------
Production-Grade LinkedIn Job & Post Scraper Bot with Authenticated Session Support.

Features:
1. Multi-Category Job Search (Up to 20 jobs per run, rate-limit protected):
   - SDE Intern, Remote Intern, AI / ML, Cloud Engineer, FDE (Forward Deployed), Fresher Tech.
   - Extracts: Job title, company, location, posted date, apply link, full JD text, recruiter emails.
2. Company Feed Scraper (Posts, updates, recruiter hiring copy):
   - e.g. https://www.linkedin.com/company/off-cam-zone/posts/?feedView=all
3. Personal Profile Activity Scraper:
   - e.g. https://www.linkedin.com/in/{username}/
4. Auto-Database Sync:
   - Ingests scraped jobs directly into JobOrbit's SQLite database (`jobs` & `hr_contacts`).
5. Safe Execution:
   - Jitter delays (1.2s - 2.5s) to protect LinkedIn accounts from rate-limiting and bans.
"""

import sys
import os
import re
import time
import json
import random
import logging
import argparse
import urllib.parse
from typing import List, Dict, Any, Optional

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Ensure Windows terminal prints UTF-8 emojis without charmap errors
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Load backend environment variables & path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("LinkedInScraper")


class LinkedInScraper:
    DEFAULT_HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/128.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
    }

    def __init__(self, li_at_cookie: Optional[str] = None, jsessionid: Optional[str] = None, timeout: int = 15):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(self.DEFAULT_HEADERS)

        # Load session credentials from params or .env
        self.li_at = (li_at_cookie or os.getenv("LINKEDIN_LI_AT", "")).strip()
        self.jsessionid = (jsessionid or os.getenv("LINKEDIN_JSESSIONID", "")).strip().strip('"')

        if self.li_at:
            self.session.cookies.set("li_at", self.li_at, domain=".linkedin.com")
            if self.jsessionid:
                self.session.cookies.set("JSESSIONID", f'"{self.jsessionid}"', domain=".linkedin.com")
                self.session.headers.update({"csrf-token": self.jsessionid})
            logger.info("LinkedIn Authenticated session active (li_at + JSESSIONID).")
        else:
            logger.info("Initialized in public guest mode.")

    # ─────────────────────────────────────────────────────────────
    # URL & Metadata Utilities
    # ─────────────────────────────────────────────────────────────

    @staticmethod
    def normalize_target_url(target: str) -> Dict[str, str]:
        target = target.strip()
        company_match = re.search(r"linkedin\.com/company/([^/?#]+)", target)
        if company_match:
            slug = company_match.group(1).strip()
            return {"type": "company", "slug": slug, "url": f"https://www.linkedin.com/company/{slug}/"}

        person_match = re.search(r"linkedin\.com/in/([^/?#]+)", target)
        if person_match:
            username = person_match.group(1).strip()
            return {
                "type": "person",
                "username": username,
                "url": f"https://www.linkedin.com/in/{username}/",
                "posts_url": f"https://www.linkedin.com/in/{username}/recent-activity/all/",
            }

        if "/" not in target and "." not in target:
            return {"type": "company", "slug": target, "url": f"https://www.linkedin.com/company/{target}/"}

        return {"type": "unknown", "url": target}

    def unshorten_url(self, short_url: str) -> str:
        if not short_url or "lnkd.in" not in short_url:
            return short_url
        try:
            r = requests.head(short_url, allow_redirects=True, timeout=6, headers={"User-Agent": "Mozilla/5.0"})
            clean_url = urllib.parse.urldefrag(r.url)[0]
            clean_url = re.sub(r"\?trk=[^&]+", "", clean_url)
            clean_url = re.sub(r"&trk=[^&]+", "", clean_url)
            return clean_url
        except Exception:
            return short_url

    def parse_job_metadata(self, text: str) -> Dict[str, Any]:
        """Extracts emails, batches, roles, companies, locations from post or description text."""
        raw_emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
        emails = list(dict.fromkeys([
            e.strip().rstrip(".") for e in raw_emails 
            if not e.endswith(".png") and not e.endswith(".jpg") and not e.endswith(".svg")
        ]))

        batches = []
        for year in ["2024", "2025", "2026", "2027", "2028"]:
            if year in text or f"{year[2:]} grads" in text.lower() or f"/{year[2:]}" in text:
                batches.append(year)
        if not batches and ("27/26/25" in text or "25/26/27" in text):
            batches = ["2025", "2026", "2027"]

        company_hiring = None
        comp_match = re.search(r"([A-Za-z0-9\.\s\(\)-]+?)\s+(?:is|are|Is)\s+Hiring", text, re.IGNORECASE)
        if comp_match:
            cand = comp_match.group(1).strip()
            cand = re.sub(r"^.*?followers\s+\d+[a-z]\s*(?:Edited)?\s*(?:Report this post)?\s*", "", cand, flags=re.IGNORECASE)
            if len(cand) < 50:
                company_hiring = cand.strip()

        role_title = None
        role_match = re.search(
            r"(?:Hiring|Looking for|Role:)\s+([A-Za-z0-9\-/\.\s]+?(?:Engineer|Developer|Intern|Lead|Specialist|Analyst|Designer|Associate))",
            text, re.IGNORECASE
        )
        if role_match:
            role_title = role_match.group(1).strip()
        else:
            for common_title in [
                "SDE Intern", "Software Engineer Intern", "SDE-1", "SDE 1", "AI Engineer",
                "Machine Learning Engineer", "Frontend Developer", "Backend Developer",
                "Full Stack Developer", "Cloud Engineer", "Data Analyst", "React.js Developer"
            ]:
                if common_title.lower() in text.lower():
                    role_title = common_title
                    break

        location = "India / Remote"
        for loc in ["Bengaluru", "Bangalore", "Hyderabad", "Pune", "Noida", "Gurugram", "Delhi", "Mumbai", "Kochi", "Ahmedabad", "Remote"]:
            if loc.lower() in text.lower():
                location = loc
                break

        return {
            "emails": emails,
            "batches": batches,
            "company_hiring": company_hiring,
            "role_title": role_title,
            "location": location,
        }

    # ─────────────────────────────────────────────────────────────
    # 1. High-Performance Job Search Engine (Up to 20 Jobs)
    # ─────────────────────────────────────────────────────────────

    def search_jobs(
        self,
        keywords: str = "sde intern",
        location: str = "India",
        limit: int = 20,
        fetch_details: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Searches LinkedIn for live jobs matching query keywords.
        Extracts up to `limit` jobs (capped at 20 by default).
        Safe execution with jitter delays between detail requests.
        """
        logger.info(f"Initiating LinkedIn Job Search: keywords='{keywords}', location='{location}', limit={limit}")
        jobs: List[Dict[str, Any]] = []
        start = 0

        while len(jobs) < limit and start < 60:
            params = {
                "keywords": keywords,
                "location": location,
                "start": start,
            }
            search_url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"

            try:
                r = self.session.get(search_url, params=params, timeout=self.timeout)
                if r.status_code != 200:
                    logger.warning(f"Job search request returned HTTP {r.status_code}")
                    break

                soup = BeautifulSoup(r.text, "html.parser")
                cards = soup.find_all("li")
                if not cards:
                    logger.info("No more job cards returned by search.")
                    break

                for c in cards:
                    if len(jobs) >= limit:
                        break

                    title_tag = c.find("h3", class_="base-search-card__title")
                    company_tag = c.find("h4", class_="base-search-card__subtitle")
                    location_tag = c.find("span", class_="job-search-card__location")
                    link_tag = c.find("a", class_="base-card__full-link")
                    time_tag = c.find("time")

                    title = title_tag.get_text(strip=True) if title_tag else "Software Engineer"
                    company = company_tag.get_text(strip=True) if company_tag else "Tech Company"
                    loc = location_tag.get_text(strip=True) if location_tag else location
                    raw_apply = link_tag.get("href") if link_tag else ""
                    clean_apply = urllib.parse.urldefrag(raw_apply)[0] if raw_apply else ""
                    posted_date = time_tag.get_text(strip=True) if time_tag else "Recently"

                    # Extract Job ID
                    job_id = None
                    id_match = re.search(r"/view/(?:[a-zA-Z0-9\-]+-)?([0-9]{8,15})", clean_apply)
                    if id_match:
                        job_id = id_match.group(1)

                    job_entry = {
                        "id": f"li-{job_id or len(jobs)+1}",
                        "job_id": job_id,
                        "title": title,
                        "company": company,
                        "location": loc,
                        "apply_url": clean_apply,
                        "posted_date": posted_date,
                        "snippet": f"{title} at {company} in {loc}. Posted {posted_date}.",
                        "description": "",
                        "emails": [],
                        "source": "linkedin_job_search",
                        "keywords_matched": keywords,
                    }

                    # Fetch full job description if requested and job_id exists
                    if fetch_details and job_id:
                        time.sleep(random.uniform(1.2, 2.4))  # Safe human jitter delay
                        desc, emails = self.fetch_job_description(job_id)
                        if desc:
                            job_entry["description"] = desc
                            job_entry["snippet"] = desc[:300] + "..."
                        if emails:
                            job_entry["emails"] = emails

                    jobs.append(job_entry)

                start += len(cards)
                time.sleep(random.uniform(1.5, 3.0))

            except Exception as e:
                logger.error(f"Error during job search pagination: {e}")
                break

        logger.info(f"Completed job search. Found {len(jobs)} jobs.")
        return jobs

    def fetch_job_description(self, job_id: str) -> tuple[str, List[str]]:
        """Fetches full job description from LinkedIn's job detail endpoint."""
        url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
        try:
            r = self.session.get(url, timeout=self.timeout)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "html.parser")
                markup = soup.find("div", class_="show-more-less-html__markup")
                if markup:
                    desc_text = markup.get_text(" ", strip=True)
                    meta = self.parse_job_metadata(desc_text)
                    return desc_text, meta["emails"]
        except Exception:
            pass
        return "", []

    # ─────────────────────────────────────────────────────────────
    # 2. Company Feed Scraper (Posts & Updates)
    # ─────────────────────────────────────────────────────────────

    def scrape_company_posts(self, target_url: str, limit: int = 20, unshorten: bool = True) -> List[Dict[str, Any]]:
        norm = self.normalize_target_url(target_url)
        clean_url = norm.get("url", target_url)
        logger.info(f"Scraping public company feed: {clean_url}")

        try:
            r = self.session.get(clean_url, timeout=self.timeout)
            if r.status_code != 200:
                logger.error(f"Failed to fetch {clean_url} (HTTP {r.status_code})")
                return []

            soup = BeautifulSoup(r.text, "html.parser")
            articles = soup.find_all("article")
            logger.info(f"Found {len(articles)} post cards in feed.")

            posts = []
            for idx, art in enumerate(articles[:limit]):
                raw_text = art.get_text(" ", strip=True)
                actor_tag = art.find(class_=lambda c: c and "actor" in str(c).lower())
                author_name = actor_tag.get_text(" ", strip=True) if actor_tag else norm.get("slug", "LinkedIn Entity")
                author_name = re.sub(r"\s+", " ", author_name)[:60].strip()

                time_tag = art.find("time")
                timestamp = time_tag.get_text(strip=True) if time_tag else "Recent"

                raw_links = [l.get("href") for l in art.find_all("a") if l.get("href")]
                filtered_links = []
                for l in raw_links:
                    if "lnkd.in" in l or ("http" in l and not any(k in l for k in ["trk=org", "login", "/in/", "/company/"])):
                        filtered_links.append(l)
                filtered_links = list(dict.fromkeys(filtered_links))

                resolved_links = []
                if unshorten:
                    for l in filtered_links[:3]:
                        resolved_links.append(self.unshorten_url(l))
                else:
                    resolved_links = filtered_links[:3]

                images = []
                for img in art.find_all("img"):
                    src = img.get("src") or img.get("data-delayed-url")
                    if src and "media.licdn.com" in src:
                        images.append(src)
                images = list(dict.fromkeys(images))[:3]

                meta = self.parse_job_metadata(raw_text)

                posts.append({
                    "id": f"li-{norm.get('slug', 'co')}-{idx+1}",
                    "author": author_name,
                    "timestamp": timestamp,
                    "role_title": meta["role_title"] or "Software Engineering / Tech Opportunity",
                    "company_hiring": meta["company_hiring"] or author_name,
                    "location": meta["location"],
                    "eligible_batches": meta["batches"],
                    "emails": meta["emails"],
                    "apply_links": resolved_links,
                    "images": images,
                    "post_snippet": raw_text[:350],
                    "full_text": raw_text,
                })

            return posts

        except Exception as e:
            logger.error(f"Error scraping company feed: {e}", exc_info=True)
            return []

    # ─────────────────────────────────────────────────────────────
    # 3. Personal Profile Scraper (Authenticated)
    # ─────────────────────────────────────────────────────────────

    def scrape_person_profile(self, profile_url: str) -> Dict[str, Any]:
        norm = self.normalize_target_url(profile_url)
        username = norm.get("username", "")

        if not self.li_at:
            return {
                "status": "authwall_protected",
                "username": username,
                "message": "LinkedIn personal profiles require an active 'li_at' session cookie.",
            }

        logger.info(f"Fetching authenticated personal profile: {username}")
        posts_url = f"https://www.linkedin.com/in/{username}/recent-activity/all/"
        try:
            r = self.session.get(posts_url, timeout=self.timeout)
            if r.status_code != 200:
                # Fallback to direct profile
                r = self.session.get(f"https://www.linkedin.com/in/{username}/", timeout=self.timeout)

            soup = BeautifulSoup(r.text, "html.parser")
            title = soup.title.string.strip() if soup.title else username
            articles = soup.find_all("article")
            posts = []
            for art in articles:
                text = art.get_text(" ", strip=True)
                meta = self.parse_job_metadata(text)
                posts.append({
                    "text": text[:300],
                    "emails": meta["emails"],
                    "role_title": meta["role_title"],
                })

            return {
                "status": "success",
                "username": username,
                "title": title,
                "posts_count": len(posts),
                "posts": posts,
            }

        except Exception as e:
            logger.error(f"Error fetching personal activity: {e}")
            return {"status": "error", "message": str(e)}

    # ─────────────────────────────────────────────────────────────
    # 4. JobOrbit Database Sync Ingestion
    # ─────────────────────────────────────────────────────────────

    def sync_to_database(self, items: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Inserts scraped jobs directly into JobOrbit's SQLite database (jobs table),
        and any discovered recruiter emails into the HRContact directory.
        """
        try:
            from app import create_app
            from core.extensions import db
            from models.job import Job, generate_job_dedupe_key
            from models.hr import HRContact, generate_hr_dedupe_key

            app = create_app({'TESTING': True})
            added_jobs = 0
            updated_jobs = 0
            added_hrs = 0

            with app.app_context():
                for item in items:
                    title = item.get("title") or item.get("role_title") or "Software Engineer"
                    company = item.get("company") or item.get("company_hiring") or "Tech Company"
                    location = item.get("location") or "Remote / India"
                    apply_url = item.get("apply_url") or (item.get("apply_links", [""])[0] if item.get("apply_links") else "")
                    snippet = item.get("snippet") or item.get("post_snippet") or ""
                    description = item.get("description") or item.get("full_text") or snippet
                    posted_date = item.get("posted_date") or item.get("timestamp") or "Recently"
                    emails = item.get("emails", [])

                    dedupe_key = generate_job_dedupe_key(title, company, location)
                    existing_job = Job.query.filter_by(dedupe_key=dedupe_key).first()

                    if existing_job:
                        existing_job.apply_url = apply_url or existing_job.apply_url
                        existing_job.posted_date_text = posted_date
                        existing_job.is_new_today = True
                        updated_jobs += 1
                    else:
                        new_job = Job(
                            dedupe_key=dedupe_key,
                            title=title,
                            company=company,
                            location=location,
                            region="India" if "india" in location.lower() or "bengaluru" in location.lower() else "Global / US",
                            job_type="Internship" if "intern" in title.lower() else "Full-time",
                            pay="Competitive",
                            is_new_today=True,
                            posted_date_text=posted_date,
                            is_early_access=True,
                            snippet=snippet,
                            description=description,
                            apply_url=apply_url,
                            source_url=apply_url,
                            source="linkedin_scraper",
                        )
                        db.session.add(new_job)
                        added_jobs += 1

                    # Save any recruiter emails into HR Contacts
                    for email in emails:
                        hr_key = generate_hr_dedupe_key(f"Hiring Team ({company})", company)
                        existing_hr = HRContact.query.filter_by(dedupe_key=hr_key).first()
                        if not existing_hr:
                            new_hr = HRContact(
                                dedupe_key=hr_key,
                                name=f"Recruiting Team",
                                title="Talent Acquisition / Hiring Team",
                                company=company,
                                location=location,
                                email=email,
                                email_status="verified",
                                source_url=apply_url,
                            )
                            db.session.add(new_hr)
                            added_hrs += 1

                db.session.commit()
                logger.info(f"Database sync complete: +{added_jobs} new jobs, {updated_jobs} updated, +{added_hrs} HR leads.")
                return {"added_jobs": added_jobs, "updated_jobs": updated_jobs, "added_hrs": added_hrs}

        except Exception as e:
            logger.error(f"Error syncing to database: {e}", exc_info=True)
            return {"error": str(e), "added_jobs": 0, "updated_jobs": 0, "added_hrs": 0}


    @staticmethod
    def export_to_csv(items: List[Dict[str, Any]], filepath: str):
        """Exports scraped jobs into a clean CSV directly importable into Google Sheets & Excel."""
        import csv
        fieldnames = ["Title", "Company", "Location", "Posted Date", "Recruiter Emails", "Apply URL", "Summary", "Source"]
        with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for item in items:
                title = item.get("title") or item.get("role_title") or ""
                company = item.get("company") or item.get("company_hiring") or ""
                loc = item.get("location") or ""
                posted = item.get("posted_date") or item.get("timestamp") or ""
                emails = ", ".join(item.get("emails", []))
                apply = item.get("apply_url") or (item.get("apply_links", [""])[0] if item.get("apply_links") else "")
                snippet = item.get("snippet") or item.get("post_snippet") or ""
                writer.writerow({
                    "Title": title,
                    "Company": company,
                    "Location": loc,
                    "Posted Date": posted,
                    "Recruiter Emails": emails,
                    "Apply URL": apply,
                    "Summary": snippet,
                    "Source": item.get("source", "linkedin"),
                })
        logger.info(f"Saved Google Sheets CSV to: {filepath}")


# ─────────────────────────────────────────────────────────────────
# CLI Execution & Standalone Runner
# ─────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="JobOrbit LinkedIn Job & Post Scraper Bot"
    )
    parser.add_argument(
        "--mode",
        choices=["search", "posts", "profile"],
        default="search",
        help="Scraping mode: 'search' (keyword job search), 'posts' (company feed), 'profile' (personal profile)",
    )
    parser.add_argument(
        "--keywords",
        "-k",
        default="sde intern",
        help="Job search keywords: e.g. 'sde intern', 'remote intern', 'ai ml', 'cloud', 'fde'",
    )
    parser.add_argument(
        "--location",
        default="India",
        help="Job location (default: India)",
    )
    parser.add_argument(
        "--target",
        "-t",
        default="https://www.linkedin.com/company/off-cam-zone/posts/?feedView=all",
        help="Target company or profile URL for 'posts' or 'profile' modes",
    )
    parser.add_argument(
        "--limit",
        "-l",
        type=int,
        default=20,
        help="Maximum items to scrape per run (default: 20)",
    )
    parser.add_argument(
        "--sync-db",
        action="store_true",
        help="Directly ingest scraped jobs and recruiter contacts into JobOrbit SQLite database",
    )
    parser.add_argument(
        "--save-json",
        "-o",
        help="File path to save the scraped JSON results",
    )
    parser.add_argument(
        "--save-csv",
        help="File path to save the Google Sheets / Excel CSV results",
    )

    args = parser.parse_args()

    scraper = LinkedInScraper()

    # Route based on mode
    if args.mode == "search":
        results = scraper.search_jobs(
            keywords=args.keywords,
            location=args.location,
            limit=args.limit,
            fetch_details=True,
        )
    elif args.mode == "posts":
        results = scraper.scrape_company_posts(
            target_url=args.target,
            limit=args.limit,
        )
    elif args.mode == "profile":
        results = scraper.scrape_person_profile(
            profile_url=args.target,
        )

    # Terminal Pretty Printing
    print("\n" + "=" * 65)
    print(f"🎯 JOBORBIT LINKEDIN BOT RUN FINISHED ({len(results) if isinstance(results, list) else 1} items)")
    print(f"Mode: {args.mode.upper()} | Limit: {args.limit}")
    if args.mode == "search":
        print(f"Keywords: '{args.keywords}' | Location: '{args.location}'")
    else:
        print(f"Target: {args.target}")
    print("=" * 65 + "\n")

    if isinstance(results, list):
        for idx, item in enumerate(results, 1):
            title = item.get("title") or item.get("role_title")
            company = item.get("company") or item.get("company_hiring")
            posted = item.get("posted_date") or item.get("timestamp")
            loc = item.get("location")
            apply = item.get("apply_url") or (item.get("apply_links", [""])[0] if item.get("apply_links") else "")

            print(f"[{idx}] {title} @ {company}")
            print(f"    📍 Location: {loc} | 📅 Posted: {posted}")
            if item.get("emails"):
                print(f"    📩 Recruiter Email: {', '.join(item['emails'])}")
            if apply:
                print(f"    🔗 Apply Link: {apply[:80]}...")
            snippet = item.get("snippet") or item.get("post_snippet") or ""
            if snippet:
                print(f"    📝 Summary: {snippet[:120]}...")
            print("-" * 65)
    else:
        print(json.dumps(results, indent=2))

    # Optional Database Ingestion
    if args.sync_db and isinstance(results, list):
        print("\n⚡ Syncing scraped opportunities directly into JobOrbit Database...")
        sync_stats = scraper.sync_to_database(results)
        print(f"✅ Sync Result: +{sync_stats.get('added_jobs', 0)} New Jobs | {sync_stats.get('updated_jobs', 0)} Updated | +{sync_stats.get('added_hrs', 0)} HR Contacts")

    # Optional CSV Export for Google Sheets
    if args.save_csv and isinstance(results, list):
        scraper.export_to_csv(results, args.save_csv)
        print(f"\n📊 Google Sheets CSV exported to: {args.save_csv}")

    # Optional JSON Export
    if args.save_json:
        with open(args.save_json, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Saved structured JSON to: {args.save_json}")


if __name__ == "__main__":
    main()

