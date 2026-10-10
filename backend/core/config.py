"""
core/config.py
--------------
Single source of truth for all application configuration.
All values come from environment variables / .env file.
NO hardcoded strings anywhere else in the codebase.
"""
import os
from typing import Optional

# Use pydantic-settings if available, otherwise fall back to a plain class
try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        # ── Flask Core ────────────────────────────────────────────────────────
        SECRET_KEY: str = "change-me-in-production"
        FLASK_ENV: str = "development"
        DEBUG: bool = False

        # ── Database ──────────────────────────────────────────────────────────
        DATABASE_URL: str = "sqlite:///data/joborbit.db"
        SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
        SQLALCHEMY_POOL_RECYCLE: int = 280
        SQLALCHEMY_POOL_TIMEOUT: int = 20
        SQLALCHEMY_POOL_SIZE: int = 25
        SQLALCHEMY_MAX_OVERFLOW: int = 50

        # ── Cache ─────────────────────────────────────────────────────────────
        CACHE_TYPE: str = "SimpleCache"          # "RedisCache" in prod
        CACHE_REDIS_URL: Optional[str] = None
        CACHE_DEFAULT_TIMEOUT: int = 300         # seconds

        # Cache TTLs per resource
        CACHE_TTL_JOB_DETAIL: int = 300          # 5 min
        CACHE_TTL_JOB_SEARCH: int = 60           # 1 min
        CACHE_TTL_ADMIN_STATS: int = 30          # 30 sec
        CACHE_TTL_RESEARCH: int = 600            # 10 min
        CACHE_TTL_HR: int = 600                  # 10 min
        CACHE_TTL_PREP: int = 3600               # 1 hr
        CACHE_TTL_FILTERS: int = 1800            # 30 min

        # ── Rate Limiting ─────────────────────────────────────────────────────
        RATELIMIT_STORAGE_URL: str = "memory://"  # "redis://localhost:6379/0" in prod
        RATE_LIMIT_DEFAULT: str = "300 per hour"
        RATE_LIMIT_SEARCH: str = "60 per minute"
        RATE_LIMIT_JOB_DETAIL: str = "120 per minute"
        RATE_LIMIT_AI: str = "20 per minute"
        RATE_LIMIT_ADMIN: str = "30 per minute"
        RATE_LIMIT_AUTH: str = "10 per minute"
        RATE_LIMIT_PREMIUM: str = "15 per minute"
        RATE_LIMIT_TRACKER: str = "60 per minute"

        # ── Scraper ───────────────────────────────────────────────────────────
        SCRAPER_BASE_URL: str = "https://www.carrerlift.in"
        SCRAPER_DELAY: float = 0.4
        SCRAPER_TIMEOUT: int = 12
        SCRAPER_MAX_RETRIES: int = 3
        SCRAPER_RETRY_WAIT_MIN: int = 2          # seconds
        SCRAPER_RETRY_WAIT_MAX: int = 10         # seconds
        SCRAPER_INCREMENTAL_STOP_STREAK: int = 5 # consecutive empty pages before stopping
        SCRAPER_USER_AGENT: str = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36 JobOrbitAggregator/2.0"
        )

        # ── Scheduler ─────────────────────────────────────────────────────────
        SYNC_INTERVAL_HOURS: int = 3

        # ── Payments (EkQR UPI & Cashfree) ──────────────────────────────────
        EKQR_API_KEY: Optional[str] = None
        CASHFREE_APP_ID: Optional[str] = None
        CASHFREE_SECRET_KEY: Optional[str] = None
        CASHFREE_ENV: str = "TEST"  # "TEST" (Sandbox) or "PROD" (Live)
        CASHFREE_API_VERSION: str = "2023-08-01"
        RAZORPAY_KEY_ID: Optional[str] = None
        RAZORPAY_KEY_SECRET: Optional[str] = None
        VIP_PRICE_LIFETIME: int = 99            # INR
        VIP_PRICE_MONTHLY: int = 74             # INR

        # ── Auth ─────────────────────────────────────────────────────────────
        GOOGLE_CLIENT_ID: Optional[str] = None
        ADMIN_TOKEN: str = "change-me-admin-secret-token"

        # ── Email / Hunter ────────────────────────────────────────────────────
        HUNTER_API_KEY: Optional[str] = None

        # ── Google Gemini LLM ─────────────────────────────────────────────────
        GEMINI_API_KEY: Optional[str] = None
        GEMINI_MODEL: str = "gemini-2.5-flash"


        # ── CORS ─────────────────────────────────────────────────────────────
        CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,https://joborbit.live,http://joborbit.live,https://www.joborbit.live"

        @property
        def cors_origins_list(self) -> list:
            return [o.strip() for o in self.CORS_ORIGINS.split(",")]

        @property
        def scraper_headers(self) -> dict:
            return {
                "User-Agent": self.SCRAPER_USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
            }

        @property
        def cache_config(self) -> dict:
            cfg = {
                "CACHE_TYPE": self.CACHE_TYPE,
                "CACHE_DEFAULT_TIMEOUT": self.CACHE_DEFAULT_TIMEOUT,
            }
            if self.CACHE_REDIS_URL:
                cfg["CACHE_REDIS_URL"] = self.CACHE_REDIS_URL
            return cfg

        class Config:
            env_file = ".env"
            env_file_encoding = "utf-8"
            extra = "ignore"

    settings = Settings()

except ImportError:
    # Fallback: plain object reading from os.environ
    class _FallbackSettings:
        SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
        FLASK_ENV = os.getenv("FLASK_ENV", "development")
        DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///data/joborbit.db")
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        CACHE_TYPE = os.getenv("CACHE_TYPE", "SimpleCache")
        CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_DEFAULT_TIMEOUT", "300"))
        CACHE_TTL_JOB_DETAIL = 300
        CACHE_TTL_JOB_SEARCH = 60
        CACHE_TTL_ADMIN_STATS = 30
        CACHE_TTL_RESEARCH = 600
        CACHE_TTL_HR = 600
        CACHE_TTL_PREP = 3600
        CACHE_TTL_FILTERS = 1800
        RATELIMIT_STORAGE_URL = "memory://"
        RATE_LIMIT_DEFAULT = "300 per hour"
        RATE_LIMIT_SEARCH = "60 per minute"
        RATE_LIMIT_JOB_DETAIL = "120 per minute"
        RATE_LIMIT_AI = "20 per minute"
        RATE_LIMIT_ADMIN = "30 per minute"
        RATE_LIMIT_AUTH = "10 per minute"
        RATE_LIMIT_PREMIUM = "15 per minute"
        RATE_LIMIT_TRACKER = "60 per minute"
        SCRAPER_BASE_URL = os.getenv("SCRAPER_BASE_URL", "https://www.carrerlift.in")
        SCRAPER_DELAY = float(os.getenv("SCRAPER_REQUEST_DELAY", "0.4"))
        SCRAPER_TIMEOUT = int(os.getenv("SCRAPER_REQUEST_TIMEOUT", "12"))
        SCRAPER_MAX_RETRIES = 3
        SCRAPER_RETRY_WAIT_MIN = 2
        SCRAPER_RETRY_WAIT_MAX = 10
        SCRAPER_INCREMENTAL_STOP_STREAK = 5
        SCRAPER_USER_AGENT = os.getenv(
            "SCRAPER_USER_AGENT",
            "Mozilla/5.0 JobOrbitAggregator/2.0"
        )
        SYNC_INTERVAL_HOURS = int(os.getenv("SYNC_INTERVAL_HOURS", "3"))
        EKQR_API_KEY = os.getenv("EKQR_API_KEY")
        CASHFREE_APP_ID = os.getenv("CASHFREE_APP_ID")
        CASHFREE_SECRET_KEY = os.getenv("CASHFREE_SECRET_KEY")
        CASHFREE_ENV = os.getenv("CASHFREE_ENV", "TEST")
        CASHFREE_API_VERSION = os.getenv("CASHFREE_API_VERSION", "2023-08-01")
        RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
        RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
        VIP_PRICE_LIFETIME = 99
        VIP_PRICE_MONTHLY = 74
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "change-me-admin-secret-token")
        HUNTER_API_KEY = os.getenv("HUNTER_API_KEY")
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://joborbit.live,http://joborbit.live,https://www.joborbit.live")


        @property
        def cors_origins_list(self):
            return [o.strip() for o in self.CORS_ORIGINS.split(",")]

        @property
        def scraper_headers(self):
            return {
                "User-Agent": self.SCRAPER_USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
            }

        @property
        def cache_config(self):
            return {
                "CACHE_TYPE": self.CACHE_TYPE,
                "CACHE_DEFAULT_TIMEOUT": self.CACHE_DEFAULT_TIMEOUT,
            }

    settings = _FallbackSettings()
