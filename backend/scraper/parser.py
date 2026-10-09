import re
import json
import logging
import urllib.parse
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ── Multi-Tier Fallback Cascade ───────────────────────────────────────────────

def _extract_json_ld(soup: BeautifulSoup, page_url: str, default_region: str) -> list[dict]:
    """
    Tier 1: Schema.org standard JobPosting JSON-LD.
    Universal industry standard for Google Jobs, LinkedIn, and ATS platforms.
    Immune to CSS class name and HTML layout changes.
    """
    jobs = []
    scripts = soup.find_all('script', type='application/ld+json')
    for script in scripts:
        if not script.string:
            continue
        try:
            data = json.loads(script.string.strip())
            items = data if isinstance(data, list) else [data]
            for item in items:
                if not isinstance(item, dict):
                    continue
                # Handle @graph or direct JobPosting
                postings = item.get('@graph', [item]) if '@graph' in item else [item]
                for p in postings:
                    if p.get('@type') != 'JobPosting':
                        continue

                    title = p.get('title', '').strip()
                    org = p.get('hiringOrganization', {})
                    company = (org.get('name') if isinstance(org, dict) else str(org)).strip()
                    if not title or not company:
                        continue

                    loc_data = p.get('jobLocation', {})
                    location = 'Remote / India'
                    if isinstance(loc_data, dict):
                        addr = loc_data.get('address', {})
                        if isinstance(addr, dict):
                            location = addr.get('addressLocality') or addr.get('addressRegion') or 'India'
                        elif isinstance(addr, str):
                            location = addr

                    pay = 'Competitive'
                    salary = p.get('baseSalary', {})
                    if isinstance(salary, dict):
                        val = salary.get('value', {})
                        if isinstance(val, dict) and val.get('value'):
                            pay = f"₹{val.get('value')}"
                        elif salary.get('currency'):
                            pay = f"{salary.get('currency')} Competitive"

                    desc = p.get('description', '')
                    clean_desc = BeautifulSoup(desc, 'html.parser').get_text(separator=' ', strip=True) if desc else f"{title} at {company}"

                    jobs.append({
                        'title': title,
                        'company': company,
                        'location': location,
                        'region': default_region,
                        'pay': pay,
                        'type': p.get('employmentType') or 'Full-time',
                        'batch': None,
                        'is_new_today': True,
                        'posted_date_text': 'Today',
                        'is_early_access': True,
                        'snippet': clean_desc[:250],
                        'description': clean_desc,
                        'apply_url': p.get('url') or page_url,
                        'apply_kind': 'link',
                        'detail_url': p.get('url') or page_url,
                        'source_url': page_url
                    })
        except Exception:
            continue
    return jobs


def _extract_next_f_stream(html: str, page_url: str, default_region: str) -> list[dict]:
    """
    Tier 2: Next.js App Router stream hydration chunks (`self.__next_f.push`).
    Extracts raw JSON payloads before DOM hydration.
    """
    jobs = []
    seen_keys = set()

    chunks = []
    for match in re.finditer(r'self\.__next_f\.push\(\[1,\s*"(.*?)"\]\)', html, re.DOTALL):
        raw = match.group(1)
        try:
            decoded = bytes(raw, "utf-8").decode("unicode_escape")
        except Exception:
            decoded = raw.replace('\\"', '"').replace('\\\\', '\\')
        chunks.append(decoded)
    full_text = "".join(chunks)
    if not full_text:
        # Fallback to direct raw scan if push syntax varied
        full_text = html

    # Support both unescaped and escaped json patterns
    job_pattern = re.compile(r'\{"job":\s*(\{[^{}]+\}),\s*"href":\s*"([^"]+)"(?:,\s*"kind":\s*"([^"]+)"|)')
    matches = list(job_pattern.finditer(full_text))
    if not matches:
        job_pattern_esc = re.compile(r'\\\{"job":\s*(\\\{[^{}]+\\\}),\s*\\"href\\":\s*\\"([^"]+)\\"')
        matches = list(job_pattern_esc.finditer(full_text))

    for m in matches:
        try:
            raw_job_str = m.group(1).replace('\\"', '"').replace('\\\\', '\\')
            j_data = json.loads(raw_job_str)
            href = m.group(2).replace('\\"', '')
            kind = (m.group(3) if len(m.groups()) >= 3 and m.group(3) else 'link').replace('\\"', '')
            slug = j_data.get('slug', '')
            title = j_data.get('role', '').strip()
            company = j_data.get('company', '').strip()
            location = j_data.get('location', '').strip() or 'Remote / India'
            pay = j_data.get('stipend', '').strip() or 'Competitive'
            job_type = j_data.get('job_type', '').strip() or 'Full-time'

            if not title or not company:
                continue

            start = max(0, m.start() - 1200)
            end = min(len(full_text), m.end() + 1200)
            context = full_text[start:end]

            batch_m = re.search(r'Batch:\s*([0-9/]+)', context)
            batch = batch_m.group(1).strip() if batch_m else None

            about_m = re.search(r'About the role:\s*([^"\\]+)', context)
            about = about_m.group(1).replace('\\n', '\n').strip() if about_m else None

            is_new_today = 'Today' in context
            posted_date_text = "Today" if is_new_today else ("Yesterday" if 'Yesterday' in context else "Recently")

            apply_raw = href.replace('\\/', '/')
            if any(k in apply_raw.lower() for k in ['internal', '/jobs/']):
                apply_url = None
                kind = 'internal'
            else:
                apply_url = apply_raw
            detail_url = f"/jobs/{slug}" if slug else "/jobs"

            dedupe_id = f"{title.lower()}|{company.lower()}|{location.lower()}"
            if dedupe_id in seen_keys:
                continue
            seen_keys.add(dedupe_id)

            snippet = about.split('\n')[0] if about else f"{title} at {company} ({location}). {job_type} opportunity."

            jobs.append({
                'title': title,
                'company': company,
                'location': location,
                'region': default_region,
                'pay': pay,
                'type': job_type,
                'batch': batch,
                'is_new_today': is_new_today,
                'posted_date_text': posted_date_text,
                'is_early_access': is_new_today,
                'snippet': snippet[:300],
                'description': about or snippet,
                'apply_url': apply_url,
                'apply_kind': kind,
                'detail_url': detail_url,
                'source_url': page_url
            })
        except Exception:
            continue

    return jobs


def _extract_next_data(soup: BeautifulSoup, page_url: str, default_region: str) -> list[dict]:
    """
    Tier 3: Next.js Pages Router `__NEXT_DATA__` JSON tag.
    Used if upstream site transitions from App Router to standard SSR pages.
    """
    jobs = []
    script = soup.find('script', id='__NEXT_DATA__')
    if not script or not script.string:
        return []

    try:
        data = json.loads(script.string.strip())
        page_props = data.get('props', {}).get('pageProps', {})
        candidates = page_props.get('jobs') or page_props.get('initialJobs') or []
        for c in candidates:
            if not isinstance(c, dict):
                continue
            title = c.get('title') or c.get('role') or ''
            company = c.get('company') or c.get('companyName') or ''
            if not title or not company:
                continue

            jobs.append({
                'title': title.strip(),
                'company': company.strip(),
                'location': c.get('location') or 'Remote / India',
                'region': default_region,
                'pay': c.get('stipend') or c.get('salary') or 'Competitive',
                'type': c.get('type') or c.get('job_type') or 'Full-time',
                'batch': c.get('batch'),
                'is_new_today': bool(c.get('is_today')),
                'posted_date_text': 'Today' if c.get('is_today') else 'Recently',
                'is_early_access': bool(c.get('is_today')),
                'snippet': (c.get('about') or c.get('snippet') or '')[:300],
                'description': c.get('description') or c.get('about'),
                'apply_url': c.get('apply_url') or c.get('href'),
                'apply_kind': 'link',
                'detail_url': c.get('slug') and f"/jobs/{c.get('slug')}" or page_url,
                'source_url': page_url
            })
    except Exception:
        pass

    return jobs


def _extract_semantic_dom(soup: BeautifulSoup, page_url: str, default_region: str) -> list[dict]:
    """
    Tier 4: Semantic HTML extraction.
    Locates article elements, [data-job] containers, and card patterns.
    Works independently of JS frameworks and bundlers.
    """
    jobs = []
    seen = set()

    cards = (
        soup.find_all('article')
        or soup.find_all('div', attrs={'data-job': True})
        or soup.find_all('div', attrs={'data-job-id': True})
        or soup.find_all('div', class_=re.compile(r'job[-_]?card', re.I))
    )

    for card in cards:
        try:
            h = card.find(['h1', 'h2', 'h3', 'h4'])
            if not h:
                continue
            title = h.get_text(strip=True)
            if len(title) < 3 or len(title) > 120:
                continue

            # Look for company name
            comp_el = (
                card.find(class_=re.compile(r'company|employer', re.I))
                or card.find('p')
            )
            company = comp_el.get_text(strip=True) if comp_el else 'Leading Employer'

            dedupe = f"{title.lower()}|{company.lower()}"
            if dedupe in seen:
                continue
            seen.add(dedupe)

            # Apply link
            apply_a = card.find('a', href=True, string=re.compile(r'apply|view', re.I)) or card.find('a', href=True)
            apply_url = apply_a['href'] if apply_a else page_url

            card_text = card.get_text(separator=' ', strip=True)
            is_new = 'Today' in card_text or 'New' in card_text

            jobs.append({
                'title': title,
                'company': company,
                'location': 'India',
                'region': default_region,
                'pay': 'Competitive',
                'type': 'Internship' if 'intern' in title.lower() else 'Full-time',
                'batch': None,
                'is_new_today': is_new,
                'posted_date_text': 'Today' if is_new else 'Recently',
                'is_early_access': is_new,
                'snippet': card_text[:250],
                'description': card_text[:1000],
                'apply_url': apply_url,
                'apply_kind': 'link',
                'detail_url': page_url,
                'source_url': page_url
            })
        except Exception:
            continue

    return jobs


def _extract_share_links(soup: BeautifulSoup, page_url: str, default_region: str) -> list[dict]:
    """
    Tier 5: Heuristic extraction via WhatsApp share and external outbound links.
    """
    jobs = []
    seen = set()
    wa_links = soup.find_all('a', href=re.compile(r'(?:wa\.me/\?text=|whatsapp\.com/send\?text=)', re.I))
    for wa in wa_links:
        try:
            parsed_url = urllib.parse.urlparse(wa['href'])
            qs = urllib.parse.parse_qs(parsed_url.query)
            text = qs.get('text', [''])[0]
            if not text:
                continue

            lines = [line.strip() for line in text.split('\n') if line.strip()]
            if not lines:
                continue

            first_line = lines[0]
            parts = re.split(r'\s+[—–-]\s+', first_line, maxsplit=1)
            title = parts[0].strip() if parts else ''
            company = parts[1].strip() if len(parts) > 1 else 'Company'

            location = 'Remote / India'
            pay = 'Competitive'
            job_type = 'Full-time'
            detail_url = page_url

            for line in lines[1:]:
                clean = line.lstrip('•* \t')
                lower = clean.lower()
                if lower.startswith('location:'):
                    location = clean.split(':', 1)[1].strip()
                elif lower.startswith('stipend:') or lower.startswith('salary:'):
                    pay = clean.split(':', 1)[1].strip()
                elif lower.startswith('type:'):
                    job_type = clean.split(':', 1)[1].strip()
                elif clean.startswith('http://') or clean.startswith('https://'):
                    detail_url = clean

            curr = wa
            card = None
            for _ in range(7):
                curr = curr.parent
                if curr and curr.find('a', string=re.compile(r'apply', re.I)):
                    card = curr
                    break

            apply_url = detail_url
            batch = None
            is_new_today = False
            about = None

            if card:
                for a in card.find_all('a', href=True):
                    if a.get_text(strip=True).lower() == 'apply' and not a['href'].startswith('#'):
                        apply_url = a['href']
                        break
                card_txt = card.get_text(separator=' ', strip=True)
                if 'Today' in card_txt:
                    is_new_today = True
                batch_m = re.search(r'Batch:\s*([0-9/]+)', card_txt)
                if batch_m:
                    batch = batch_m.group(1).strip()
                about_m = re.search(r'About the role:\s*([^.]+?\.)', card_txt)
                if about_m:
                    about = about_m.group(1).strip()

            dedupe_id = f"{title.lower()}|{company.lower()}|{location.lower()}"
            if dedupe_id in seen:
                continue
            seen.add(dedupe_id)

            snippet = about or f"{title} at {company} ({location}). {job_type} opportunity."

            jobs.append({
                'title': title,
                'company': company,
                'location': location,
                'region': default_region,
                'pay': pay,
                'type': job_type,
                'batch': batch,
                'is_new_today': is_new_today,
                'posted_date_text': 'Today' if is_new_today else 'Recently',
                'is_early_access': is_new_today,
                'snippet': snippet[:300],
                'description': about or snippet,
                'apply_url': apply_url,
                'apply_kind': 'link',
                'detail_url': detail_url,
                'source_url': page_url
            })
        except Exception:
            continue
    return jobs


def parse_listing_page(html: str, page_url: str, default_region: str = 'India') -> list[dict]:
    """
    Multi-Tier Resilient Parser Cascade:
      Tier 1: Schema.org JSON-LD (<script type="application/ld+json">)
      Tier 2: Next.js App Router stream hydration (self.__next_f.push)
      Tier 3: Next.js Pages Router (__NEXT_DATA__)
      Tier 4: Semantic HTML cards (<article>, [data-job], [class*="job-card"])
      Tier 5: Heuristic link text & WhatsApp share parsing
    """
    soup = BeautifulSoup(html, 'html.parser')

    # Tier 1: Schema.org standard (Highest fidelity, immune to DOM shifts)
    jobs = _extract_json_ld(soup, page_url, default_region)
    if jobs:
        logger.info(f"[Resilience Tier 1 - JSON-LD] Extracted {len(jobs)} jobs from {page_url}")
        return jobs

    # Tier 2: Next.js App Router stream chunks
    jobs = _extract_next_f_stream(html, page_url, default_region)
    if jobs:
        return jobs

    # Tier 3: Next.js Pages Router __NEXT_DATA__
    jobs = _extract_next_data(soup, page_url, default_region)
    if jobs:
        logger.info(f"[Resilience Tier 3 - NextData] Extracted {len(jobs)} jobs from {page_url}")
        return jobs

    # Tier 4: Semantic HTML DOM
    jobs = _extract_semantic_dom(soup, page_url, default_region)
    if jobs:
        logger.warning(f"[Resilience Tier 4 - Semantic DOM] Fallback extracted {len(jobs)} jobs from {page_url}")
        return jobs

    # Tier 5: Share link heuristics
    jobs = _extract_share_links(soup, page_url, default_region)
    if jobs:
        logger.warning(f"[Resilience Tier 5 - Share Link Heuristic] Extracted {len(jobs)} jobs from {page_url}")
        return jobs

    logger.error(f"[Scraper Alert] All 5 extraction tiers returned 0 jobs for {page_url}. Upstream structure may have undergone fundamental redesign.")
    return []


def parse_global_listing_page(html: str, page_url: str) -> list[dict]:
    """
    Parses worldwide / US listings from the global feed section.
    """
    jobs = []
    seen = set()

    chunks = []
    for match in re.finditer(r'self\.__next_f\.push\(\[1,\s*"(.*?)"\]\)', html):
        raw = match.group(1)
        try:
            chunks.append(bytes(raw, "utf-8").decode("unicode_escape"))
        except Exception:
            chunks.append(raw)
    full_text = "".join(chunks)

    # Global cards regex pattern
    pattern = re.compile(
        r'truncate text-xs text-muted","children":"([^"]+)"\}\],\["\$","h2",null,\{"className":"[^"]*","children":\["\$","\$L[a-z0-9]+",null,\{"href":"(/global/[^"]+)","prefetch":false,"className":"[^"]*","children":"([^"]+)"'
    )
    matches = pattern.findall(full_text)

    for company, rel_href, title in matches:
        title = title.strip()
        company = company.strip()
        if not title or not company:
            continue

        slug = rel_href.split('/')[-1] if '/' in rel_href else rel_href
        detail_url = f"/jobs/{slug}"
        apply_url = None
        apply_kind = 'internal'
        dedupe_id = f"{title.lower()}|{company.lower()}"
        if dedupe_id in seen:
            continue
        seen.add(dedupe_id)

        # Context around match for tags (International internships, Today, etc.)
        pos = full_text.find(rel_href)
        context = full_text[pos:pos+1500] if pos != -1 else ""

        is_new_today = 'Today' in context and 'New' in context
        job_type = 'Internship' if 'intern' in title.lower() or 'apprentice' in title.lower() else 'Full-time'

        jobs.append({
            'title': title,
            'company': company,
            'location': 'US / Global Remote',
            'region': 'Global / US',
            'pay': 'Competitive ($USD)',
            'type': job_type,
            'batch': None,
            'is_new_today': is_new_today,
            'posted_date_text': 'Today' if is_new_today else 'Recently',
            'is_early_access': is_new_today,
            'snippet': f"{title} at {company}. Global AI/ML and software opportunity.",
            'description': f"{title} at {company}. International role in software, AI/ML, and technology.",
            'apply_url': apply_url,
            'apply_kind': apply_kind,
            'detail_url': detail_url,
            'source_url': page_url
        })

    return jobs

def parse_max_pagination_pages(html: str, default: int = 68) -> int:
    """
    Detects maximum pagination page number from HTML.
    """
    soup = BeautifulSoup(html, 'html.parser')
    page_links = soup.find_all('a', href=re.compile(r'page=(\d+)'))
    page_nums = []
    for a in page_links:
        m = re.search(r'page=(\d+)', a['href'])
        if m:
            page_nums.append(int(m.group(1)))
    return max(page_nums) if page_nums else default
