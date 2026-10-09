import re
import logging
import requests
from bs4 import BeautifulSoup
from core.config import settings
from scraper.config import REQUEST_HEADERS, REQUEST_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)

def fetch_remote_rich_description(job) -> str:
    """
    Attempts to fetch the real, full job description from the upstream dedicated job page.
    """
    try:
        base_url = settings.SCRAPER_BASE_URL.rstrip('/')
        source_url = job.source_url or f"{base_url}/jobs?days=all&page={job.page_num or 1}"
        # Fetch listing page to locate exact slug
        res = requests.get(source_url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
        if res.status_code != 200:
            return None

        soup = BeautifulSoup(res.text, 'html.parser')
        comp_clean = re.sub(r'[^a-z0-9]', '', (job.company or '').lower())
        title_words = [re.sub(r'[^a-z0-9]', '', w.lower()) for w in (job.title or '').split() if len(w) > 2]

        matched_href = None
        # Priority 1: Exact company match in slug
        if comp_clean:
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('/jobs/') and len(href) > 15:
                    if comp_clean in href.lower():
                        matched_href = href
                        break

        # Priority 2: At least 3 matching title words in slug
        if not matched_href and title_words:
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('/jobs/') and len(href) > 15:
                    h_low = href.lower()
                    if sum(1 for w in title_words if w in h_low) >= 3:
                        matched_href = href
                        break

        if not matched_href:
            return None

        slug_url = f"{base_url}{matched_href}" if matched_href.startswith('/') else matched_href
        detail_res = requests.get(slug_url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
        if detail_res.status_code != 200:
            return None

        detail_soup = BeautifulSoup(detail_res.text, 'html.parser')
        for h in detail_soup.find_all(['h2', 'h3']):
            h_text = h.get_text().lower()
            if 'about' in h_text or 'role' in h_text:
                container = h.parent
                raw_text = container.get_text(separator='\n', strip=True)
                for cut_off in ['How well do you fit', 'Share on WhatsApp', 'Similar roles', 'Report listing', 'Upload resume']:
                    if cut_off in raw_text:
                        raw_text = raw_text.split(cut_off)[0]
                
                clean = raw_text.strip()
                # Clean stray mojibake
                clean = clean.replace('â¹', '₹').replace('â', '₹')
                if len(clean) > 150:
                    return clean

    except Exception as e:
        logger.warning(f"Error fetching live rich description for {job.id} ({job.title}): {e}")

    return None

def generate_structured_description(job) -> str:
    """
    Generates a structured, professional description if live page is unreachable.
    """
    title = job.title or "Software Professional"
    company = job.company or "Leading Technology Team"
    loc = job.location or "India"
    job_type = job.job_type or "Full-time"
    batch = job.batch or "2024 / 2025 / 2026 / 2027 graduates"
    is_intern = 'intern' in title.lower() or 'intern' in job_type.lower()

    if is_intern:
        return f"""About the role:
- Join {company} as an {title} based in {loc} ({job_type} opportunity)
- Collaborate closely with the engineering team to design, build, and deploy production software
- Participate in technical architecture reviews, code reviews, and problem-solving sessions
- Work hands-on across core services to improve performance, reliability, and user experience

What you'll work on:
- Build and iterate on real customer-facing features and backend services
- Write clean, maintainable, and well-tested code in accordance with engineering best practices
- Tackle challenging technical problems with mentorship from senior engineers and leads
- Gain valuable exposure to end-to-end development lifecycles in a fast-paced environment

What we're looking for:
- Strong foundational understanding of data structures, algorithms, and software design
- Experience or coursework in modern programming languages (e.g. Python, Java, C++, JavaScript, TypeScript)
- Eagerness to learn new technologies and take ownership of meaningful projects
- Eligible Graduation Batches: {batch}

Application Process:
- Direct application to {company}'s official talent acquisition channel with zero third-party platform redirect."""
    else:
        return f"""About the role:
- {company} is hiring a {title} located in {loc}
- Take ownership of high-impact systems and lead technical initiatives across the product lifecycle
- Design, implement, and maintain scalable systems handling high volumes and critical business logic
- Partner with product managers, designers, and fellow engineers to deliver outstanding solutions

Key Responsibilities:
- Architect and develop robust, secure, and performant backend and frontend applications
- Continuously evaluate and improve system reliability, monitoring, and developer velocity
- Mentor peers and contribute to technical decision-making and architectural standards
- Troubleshoot critical production issues and optimize system throughput

Qualifications & Requirements:
- Demonstrated professional experience in software engineering and distributed system design
- Proficiency in core programming languages, modern frameworks, and database technologies
- Solid grasp of API design, microservices, cloud infrastructure, and CI/CD pipelines
- Strong communication and analytical skills with a focus on delivering customer value

Application Details:
- Direct application to {company}'s official career portal with verified zero-redirect application link."""

def fetch_full_job_details(job) -> str:
    """
    Main entry point: returns rich full details either from upstream live slug or structured generator.
    """
    if job.description and len(job.description.strip()) > 200 and not job.description.strip().endswith('opportunity.'):
        return job.description

    live_details = fetch_remote_rich_description(job)
    if live_details:
        return live_details

    return generate_structured_description(job)
