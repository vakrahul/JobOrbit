import os

BASE_URL = os.getenv("SCRAPER_BASE_URL", "https://www.carrerlift.in")
SITEMAP_URL = f"{BASE_URL}/sitemap.xml"
USER_AGENT = os.getenv(
    "SCRAPER_USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 JobOrbitAggregator/1.0"
)

REQUEST_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}

# Rate limit between requests (seconds) to respect servers
REQUEST_DELAY_SECONDS = float(os.getenv("SCRAPER_REQUEST_DELAY", "1.0"))
REQUEST_TIMEOUT_SECONDS = int(os.getenv("SCRAPER_REQUEST_TIMEOUT", "12"))

# Core public listing pages to always crawl
CORE_LISTING_PATHS = [
    "/jobs",
    "/law",
    "/research",
    "/global",
]

# Top public category pages to crawl
FEATURED_CATEGORY_PATHS = [
    "/jobs/devops-engineer-jobs-in-remote",
    "/jobs/backend-developer-jobs-in-remote",
    "/jobs/full-stack-developer-jobs-in-remote",
    "/jobs/software-engineer-jobs-in-bangalore",
    "/jobs/ai-engineer-jobs-in-mumbai",
    "/jobs/data-scientist-jobs-in-remote",
    "/jobs/business-analyst-jobs-in-gurugram",
    "/jobs/ui-ux-designer-jobs-in-remote",
    "/jobs/machine-learning-engineer-jobs-in-gurugram",
    "/jobs/software-engineer-jobs-in-gurugram",
]

HR_DIRECTORY_URL = f"{BASE_URL}/hr"
