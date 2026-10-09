"""
scraper/base_scraper.py
-----------------------
Abstract base class for all scrapers.
Implements:
  - HTTP session management
  - Retry with exponential backoff (tenacity)
  - Polite delay between requests
  - Incremental stop logic
  - Abstract interface: parse_page(), get_listing_url(), _upsert()

All source-specific scrapers (India, Global, HR) inherit this.
"""
import time
import logging
from abc import ABC, abstractmethod
from typing import Optional

import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from core.config import settings

logger = logging.getLogger(__name__)


class ScraperConfig:
    """
    Immutable configuration object passed into each scraper instance.
    No hardcoded values — all sourced from Settings.
    """
    def __init__(
        self,
        base_url: Optional[str] = None,
        delay: Optional[float] = None,
        timeout: Optional[int] = None,
        max_retries: Optional[int] = None,
        stop_streak: Optional[int] = None,
        headers: Optional[dict] = None,
    ):
        self.base_url = base_url or settings.SCRAPER_BASE_URL
        self.delay = delay if delay is not None else settings.SCRAPER_DELAY
        self.timeout = timeout or settings.SCRAPER_TIMEOUT
        self.max_retries = max_retries or settings.SCRAPER_MAX_RETRIES
        self.stop_streak = stop_streak or settings.SCRAPER_INCREMENTAL_STOP_STREAK
        self.headers = headers or settings.scraper_headers


class BaseScraper(ABC):
    """
    Abstract base class for all JobOrbit scrapers.

    Subclasses must implement:
      - get_listing_url(page)  → URL string
      - parse_page(html, url)  → list of job dicts
      - _upsert(jobs)          → int (count of new records)

    Provides:
      - fetch(url) with retry + backoff
      - polite_sleep() between requests
      - run() orchestration loop with incremental stop
    """

    def __init__(self, config: Optional[ScraperConfig] = None):
        self.config = config or ScraperConfig()
        self.session = requests.Session()
        self.session.headers.update(self.config.headers)
        self._logger = logging.getLogger(self.__class__.__name__)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((requests.HTTPError, requests.ConnectionError, requests.Timeout)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
    )
    def fetch(self, url: str) -> str:
        """
        Fetch a URL with automatic retry + exponential backoff.
        Raises on 4xx/5xx after all retries are exhausted.
        """
        resp = self.session.get(url, timeout=self.config.timeout)
        resp.raise_for_status()
        return resp.text

    def polite_sleep(self) -> None:
        """Respectful delay between requests to avoid hammering source servers."""
        time.sleep(self.config.delay)

    @abstractmethod
    def get_listing_url(self, page: int) -> str:
        """Return the URL for a given page number."""
        raise NotImplementedError

    @abstractmethod
    def parse_page(self, html: str, url: str) -> list[dict]:
        """Parse raw HTML into a list of job/contact dicts."""
        raise NotImplementedError

    @abstractmethod
    def _upsert(self, items: list[dict]) -> int:
        """
        Persist items to DB.
        Returns the count of NEW records inserted (not updates).
        """
        raise NotImplementedError

    def run(
        self,
        max_pages: Optional[int] = None,
        incremental: bool = True,
        progress_callback=None,
    ) -> dict:
        """
        Main scrape loop:
        1. Fetch page
        2. Parse
        3. Upsert to DB
        4. If incremental and no new records for N consecutive pages → stop

        progress_callback(page, total_pages, extracted, added) is optional.
        """
        all_extracted = 0
        total_added = 0
        stop_streak = 0
        page = 1
        # Get total page count from first fetch
        first_html = None
        total_pages = max_pages or 999

        while page <= total_pages:
            url = self.get_listing_url(page)
            try:
                html = first_html if (page == 1 and first_html) else self.fetch(url)
                if page == 1:
                    first_html = html
                    detected = self._detect_total_pages(html)
                    if detected:
                        total_pages = min(detected, max_pages or detected)
                        self._logger.info(f"Detected {total_pages} total pages")

                items = self.parse_page(html, url)
                all_extracted += len(items)

                if not items:
                    self._logger.info(f"Page {page}: no items found, stopping.")
                    break

                new_count = self._upsert(items)
                total_added += new_count

                if progress_callback:
                    try:
                        progress_callback(page, total_pages, all_extracted, new_count)
                    except Exception:
                        pass

                self._logger.info(
                    f"Page {page}/{total_pages}: extracted={len(items)}, new={new_count}"
                )

                # Incremental stop: if N consecutive pages have zero new records, stop early
                if incremental:
                    if new_count == 0:
                        stop_streak += 1
                        if stop_streak >= self.config.stop_streak:
                            self._logger.info(
                                f"Incremental stop: {stop_streak} consecutive pages with 0 new records. Stopping at page {page}."
                            )
                            break
                    else:
                        stop_streak = 0

                self.polite_sleep()
                page += 1

            except Exception as e:
                self._logger.error(f"Error on page {page}: {e}")
                break

        return {
            'pages_crawled': page - 1,
            'extracted': all_extracted,
            'added': total_added,
        }

    def _detect_total_pages(self, html: str) -> Optional[int]:
        """
        Try to detect total page count from HTML pagination.
        Override in subclass for source-specific logic.
        """
        try:
            from scraper.parser import parse_max_pagination_pages
            return parse_max_pagination_pages(html)
        except Exception:
            return None
