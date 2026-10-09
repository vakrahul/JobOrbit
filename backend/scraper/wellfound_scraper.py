"""
scraper/wellfound_scraper.py
-----------------------------
Wellfound (formerly AngelList Talent) scraper for India-based jobs and internships.
Targets: Remote, Hybrid, and Onsite internships & early career tech roles across India.

Strategy (multi-tier fallback):
  Tier 1: Next.js SSR Apollo hydration state (__NEXT_DATA__.props.pageProps.apolloState.data)
  Tier 2: Direct Next.js pageProps listings (__NEXT_DATA__.props.pageProps.jobListings)
  Tier 3: Semantic DOM scraping (fallback card selectors)
  Tier 4: JSON-LD structured data (@type: JobPosting)

All tiers produce standard Job models with verified external Wellfound application URLs.
"""
import re
import json
import logging
import time
from datetime import datetime, timezone
from typing import Optional

import requests
from bs4 import BeautifulSoup
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from core.config import settings
from models.job import Job, generate_job_dedupe_key
from core.extensions import db

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────

WELLFOUND_BASE = "https://wellfound.com"

# High-yield verified India tech hub locations on Wellfound
WELLFOUND_INDIA_URLS = [
    f"{WELLFOUND_BASE}/location/india",
    f"{WELLFOUND_BASE}/location/bangalore",
    f"{WELLFOUND_BASE}/location/new-delhi",
    f"{WELLFOUND_BASE}/location/pune",
    f"{WELLFOUND_BASE}/location/hyderabad",
    f"{WELLFOUND_BASE}/location/mumbai",
    f"{WELLFOUND_BASE}/location/gurugram",
    f"{WELLFOUND_BASE}/location/noida",
]

INDIAN_CITIES = {
    "bangalore", "bengaluru", "mumbai", "delhi", "new delhi", "pune",
    "hyderabad", "gurugram", "gurgaon", "noida", "chennai", "kolkata",
    "ahmedabad", "jaipur", "kochi", "chandigarh", "indore"
}

WELLFOUND_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://wellfound.com/",
    "Cache-Control": "no-cache",
    "DNT": "1",
}

SOURCE_TAG = "wellfound_india"


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────

def _resolve_india_location(loc_names: list, url: str) -> str:
    """Pick the most accurate Indian city from location list or fallback to URL city."""
    if loc_names:
        for loc in loc_names:
            if any(c in loc.lower() for c in INDIAN_CITIES):
                return loc.strip()
        return loc_names[0].strip()

    # Fallback to URL path
    for c in INDIAN_CITIES:
        if c in url.lower():
            return c.title()
    return "India"


def _build_job_dict(
    title: str,
    company: str,
    location: str,
    work_type: str = "Hybrid",
    pay: Optional[str] = None,
    snippet: str = "",
    description: str = "",
    apply_url: str = "",
    detail_url: str = "",
    source_url: str = "",
    is_internship: bool = False,
    batch: Optional[str] = None,
) -> dict:
    """Build a unified dictionary ready for Job model upsert."""
    now_utc = datetime.now(timezone.utc)
    job_type = "Internship" if is_internship else "Full-time"
    clean_title = (title or "").strip()
    clean_company = (company or "").strip()

    # Format location string with work type context
    clean_loc = (location or "India").strip()
    if work_type == "Remote" and "remote" not in clean_loc.lower():
        formatted_loc = f"Remote – {clean_loc}" if clean_loc != "India" else "Remote – India"
    elif work_type == "Hybrid" and "hybrid" not in clean_loc.lower():
        formatted_loc = f"Hybrid – {clean_loc}" if clean_loc != "India" else "Hybrid – India"
    else:
        formatted_loc = clean_loc

    if not pay or pay.strip() in ("", "$0", "None"):
        pay_str = "Competitive / Stipend" if is_internship else "Competitive"
    else:
        pay_str = pay.strip().replace("â¹", "₹").replace("â", "₹")

    return {
        "title": clean_title,
        "company": clean_company,
        "location": formatted_loc,
        "region": "India",
        "type": job_type,
        "pay": pay_str,
        "batch": batch,
        "is_new_today": True,
        "posted_date_text": "Today",
        "is_early_access": True,
        "snippet": snippet.strip()[:300] if snippet else f"{clean_title} at {clean_company}. Apply direct on Wellfound.",
        "description": description.strip() if description else (snippet or ""),
        "apply_url": apply_url or detail_url or source_url,
        "apply_kind": "link",
        "detail_url": detail_url or apply_url or source_url,
        "source_url": source_url,
        "source": SOURCE_TAG,
        "work_type": work_type,
    }


# ─────────────────────────────────────────────────────────────────
# Parser Tiers
# ─────────────────────────────────────────────────────────────────

def _tier1_next_data_apollo(html: str, source_url: str) -> list[dict]:
    """Tier 1: Parse Apollo GraphQL hydration state in Next.js __NEXT_DATA__."""
    jobs = []
    try:
        soup = BeautifulSoup(html, "html.parser")
        tag = soup.find("script", id="__NEXT_DATA__")
        if not tag or not tag.string:
            return jobs

        data = json.loads(tag.string)
        page_props = data.get("props", {}).get("pageProps", {})
        inner = page_props.get("apolloState", {}).get("data", {})
        if not inner:
            return jobs

        # Map startups by GraphQL ID and highlighted job references
        startups = {}
        for k, v in inner.items():
            if isinstance(v, dict) and v.get("__typename") == "StartupResult":
                name = v.get("name")
                startups[k] = name
                for jref in v.get("highlightedJobListings", []):
                    ref_id = jref.get("__ref")
                    if ref_id:
                        startups[ref_id] = name

        for k, v in inner.items():
            if not isinstance(v, dict) or v.get("__typename") != "JobListingSearchResult":
                continue

            jid = str(v.get("id", ""))
            slug = v.get("slug", "")
            title = (v.get("title") or "").strip()
            if not title:
                continue

            company = startups.get(k) or startups.get(f"JobListingSearchResult:{jid}") or "Wellfound Startup"

            # URLs: Wellfound job detail page is the direct application destination
            job_url = f"{WELLFOUND_BASE}/jobs/{jid}-{slug}" if slug else f"{WELLFOUND_BASE}/jobs/{jid}"

            # Work type detection
            is_remote = bool(v.get("remote"))
            remote_cfg = v.get("remoteConfig") or {}
            kind = (remote_cfg.get("kind") or "").upper() if isinstance(remote_cfg, dict) else ""

            if is_remote or kind == "REMOTE":
                wtype = "Remote"
            elif kind == "HYBRID" or "hybrid" in str(v).lower():
                wtype = "Hybrid"
            else:
                wtype = "Onsite"

            loc_names = v.get("locationNames") or []
            loc_clean = _resolve_india_location(loc_names, source_url)

            # Internship determination
            raw_type = (v.get("jobType") or "").lower()
            min_exp = v.get("yearsExperienceMin")
            is_intern = (
                "intern" in raw_type
                or "intern" in title.lower()
                or "trainee" in title.lower()
                or "apprentice" in title.lower()
                or (min_exp == 0 and any(w in title.lower() for w in ["fresher", "junior", "graduate", "entry"]))
            )

            comp = v.get("compensation") or ""
            desc = v.get("description") or ""

            jobs.append(_build_job_dict(
                title=title,
                company=company,
                location=loc_clean,
                work_type=wtype,
                pay=comp,
                snippet=desc[:300] if desc else f"{title} at {company} ({loc_clean})",
                description=desc,
                apply_url=job_url,
                detail_url=job_url,
                source_url=source_url,
                is_internship=is_intern,
            ))
    except Exception as e:
        logger.debug(f"[WF Tier1 Apollo] Failed: {e}")

    return jobs


def _tier2_next_data_direct(html: str, source_url: str) -> list[dict]:
    """Tier 2: Parse direct arrays in Next.js pageProps if Apollo state not present."""
    jobs = []
    try:
        soup = BeautifulSoup(html, "html.parser")
        tag = soup.find("script", id="__NEXT_DATA__")
        if not tag or not tag.string:
            return jobs

        data = json.loads(tag.string)
        page_props = data.get("props", {}).get("pageProps", {})

        candidates = []
        for key in ["jobListings", "startups", "jobs", "results", "listings"]:
            val = page_props.get(key)
            if isinstance(val, list) and val:
                candidates = val
                break

        for item in candidates:
            if not isinstance(item, dict):
                continue
            startup = item.get("startup") or item.get("company") or {}
            company = startup.get("name") or item.get("companyName") or "Wellfound Startup"
            title = item.get("title") or item.get("role") or ""
            if not title:
                continue

            slug = item.get("slug") or item.get("id") or ""
            job_url = f"{WELLFOUND_BASE}/jobs/{slug}" if slug else source_url
            loc = item.get("locationNames", ["India"])
            loc_str = loc[0] if isinstance(loc, list) and loc else "India"

            is_intern = (
                "intern" in title.lower()
                or item.get("jobType", "").lower() == "internship"
                or item.get("isInternship", False)
            )

            jobs.append(_build_job_dict(
                title=title,
                company=company,
                location=loc_str,
                work_type="Hybrid",
                pay=item.get("salary") or item.get("compensation"),
                snippet=item.get("description", "")[:300],
                description=item.get("description", ""),
                apply_url=job_url,
                detail_url=job_url,
                source_url=source_url,
                is_internship=is_intern,
            ))
    except Exception as e:
        logger.debug(f"[WF Tier2 Direct] Failed: {e}")

    return jobs


def _tier3_semantic_dom(html: str, source_url: str) -> list[dict]:
    """Tier 3: Semantic BeautifulSoup DOM parsing."""
    jobs = []
    try:
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not ("/jobs/" in href and len(href) > 10):
                continue

            title = a.get_text(strip=True)
            if not title or len(title) < 4 or len(title) > 120:
                continue

            parent = a.find_parent("div")
            card_text = parent.get_text(separator=" ", strip=True) if parent else ""

            is_intern = "intern" in title.lower() or "intern" in card_text.lower()
            full_url = href if href.startswith("http") else f"{WELLFOUND_BASE}{href}"

            jobs.append(_build_job_dict(
                title=title,
                company="Startup (Wellfound)",
                location="India",
                work_type="Remote" if "remote" in card_text.lower() else "Hybrid",
                pay="Competitive",
                snippet=card_text[:300],
                apply_url=full_url,
                detail_url=full_url,
                source_url=source_url,
                is_internship=is_intern,
            ))
    except Exception as e:
        logger.debug(f"[WF Tier3 DOM] Failed: {e}")

    return jobs


def _tier4_json_ld(html: str, source_url: str) -> list[dict]:
    """Tier 4: Parse Schema.org JobPosting structured data."""
    jobs = []
    try:
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(tag.string or "")
            except Exception:
                continue

            items = data if isinstance(data, list) else [data]
            for item in items:
                if not isinstance(item, dict) or item.get("@type") != "JobPosting":
                    continue

                title = item.get("title", "")
                hiring_org = item.get("hiringOrganization", {})
                company = hiring_org.get("name", "Wellfound Startup") if isinstance(hiring_org, dict) else "Wellfound Startup"
                apply_url = item.get("url") or source_url
                is_intern = "intern" in title.lower() or item.get("employmentType", "").lower() == "intern"

                jobs.append(_build_job_dict(
                    title=title,
                    company=company,
                    location="India",
                    work_type="Remote",
                    pay=None,
                    snippet=item.get("description", "")[:300],
                    description=item.get("description", ""),
                    apply_url=apply_url,
                    detail_url=apply_url,
                    source_url=source_url,
                    is_internship=is_intern,
                ))
    except Exception as e:
        logger.debug(f"[WF Tier4 JSON-LD] Failed: {e}")

    return jobs


def parse_wellfound_page(html: str, source_url: str) -> list[dict]:
    """
    Run 4 tiers in cascade; return results from first tier that yields data.
    """
    for tier_fn, tier_name in [
        (_tier1_next_data_apollo, "Tier1/ApolloState"),
        (_tier2_next_data_direct, "Tier2/NextDataDirect"),
        (_tier3_semantic_dom, "Tier3/DOM"),
        (_tier4_json_ld, "Tier4/JSON-LD"),
    ]:
        try:
            results = tier_fn(html, source_url)
            if results:
                logger.info(f"[WF] {tier_name}: extracted {len(results)} jobs from {source_url}")
                return results
        except Exception as e:
            logger.warning(f"[WF] {tier_name} error: {e}")

    logger.warning(f"[WF] All tiers failed for {source_url}.")
    return []


# ─────────────────────────────────────────────────────────────────
# WellfoundScraper Class
# ─────────────────────────────────────────────────────────────────

class WellfoundScraper:
    """
    Scrapes India tech internships and jobs from Wellfound.com.
    Coverage: Remote, Hybrid, Onsite across India tech hubs.
    """

    def __init__(self, target_urls: Optional[list] = None):
        self.session = requests.Session()
        self.session.headers.update(WELLFOUND_HEADERS)
        self.delay = getattr(settings, "SCRAPER_DELAY", 1.0)
        self.timeout = getattr(settings, "SCRAPER_TIMEOUT", 15)
        self.urls = target_urls or WELLFOUND_INDIA_URLS
        self._logger = logging.getLogger(self.__class__.__name__)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((requests.HTTPError, requests.ConnectionError, requests.Timeout)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
    )
    def _fetch(self, url: str) -> str:
        resp = self.session.get(url, timeout=self.timeout)
        resp.raise_for_status()
        return resp.text

    def _upsert(self, jobs: list[dict]) -> tuple[int, int]:
        """Persist jobs to DB. Returns (new_count, updated_count)."""
        now_utc = datetime.now(timezone.utc)
        new_count = 0
        updated_count = 0

        try:
            for j in jobs:
                title = j.get("title", "").strip()
                company = j.get("company", "").strip()
                location = j.get("location", "India").strip()

                if not title or not company:
                    continue

                d_key = generate_job_dedupe_key(title, company, location)
                existing = Job.query.filter_by(dedupe_key=d_key).first()

                if existing:
                    existing.updated_at = now_utc
                    if j.get("pay") and "competitive" not in j["pay"].lower():
                        existing.pay = j["pay"]
                    if j.get("description") and len(j["description"]) > len(existing.description or ""):
                        existing.description = j["description"]
                    if j.get("apply_url") and not existing.apply_url:
                        existing.apply_url = j["apply_url"]
                    updated_count += 1
                else:
                    new_job = Job(
                        dedupe_key=d_key,
                        title=title,
                        company=company,
                        location=location,
                        region="India",
                        job_type=j.get("type", "Internship"),
                        pay=j.get("pay", "Competitive"),
                        batch=j.get("batch"),
                        is_new_today=True,
                        posted_date_text="Today",
                        is_early_access=True,
                        snippet=j.get("snippet", ""),
                        description=j.get("description", ""),
                        apply_url=j.get("apply_url", ""),
                        apply_kind=j.get("apply_kind", "link"),
                        detail_url=j.get("detail_url", ""),
                        source_url=j.get("source_url", ""),
                        source=SOURCE_TAG,
                        posted_at=now_utc,
                        created_at=now_utc,
                    )
                    db.session.add(new_job)
                    new_count += 1

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            self._logger.error(f"[WF] Upsert error: {e}")

        return new_count, updated_count

    def run(
        self,
        incremental: bool = False,
        max_urls: Optional[int] = None,
        progress_callback=None,
    ) -> dict:
        """
        Scrape configured Wellfound India URLs.
        Returns summary: {source, urls_crawled, extracted, added, updated}.
        """
        urls = self.urls[:max_urls] if max_urls else self.urls
        total_extracted = 0
        total_added = 0
        total_updated = 0
        crawled_count = 0

        for idx, url in enumerate(urls):
            try:
                self._logger.info(f"[WF] Scraping {idx+1}/{len(urls)}: {url}")
                html = self._fetch(url)
                jobs = parse_wellfound_page(html, url)
                total_extracted += len(jobs)

                added, updated = self._upsert(jobs)
                total_added += added
                total_updated += updated
                crawled_count += 1

                if progress_callback:
                    try:
                        progress_callback(idx + 1, len(urls), total_extracted, added)
                    except Exception:
                        pass

                self._logger.info(
                    f"[WF] {url}: Extracted {len(jobs)} -> Added {added}, Updated {updated}"
                )

                time.sleep(self.delay)

            except Exception as e:
                self._logger.error(f"[WF] Failed {url}: {e}")

        return {
            "source": SOURCE_TAG,
            "urls_crawled": crawled_count,
            "extracted": total_extracted,
            "added": total_added,
            "updated": total_updated,
        }
