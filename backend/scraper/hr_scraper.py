import re
import json
import logging
import urllib.parse
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

def derive_email_patterns(name: str, domain: str) -> list[str]:
    """
    Derives standard corporate email patterns from a contact's name and company domain.
    E.g., Pretty Philip at copado.com:
    - pretty.philip@copado.com
    - pretty@copado.com
    - pphilip@copado.com
    - pretty_philip@copado.com
    """
    if not name or not domain:
        return []

    # Clean domain
    domain = domain.lower().replace('http://', '').replace('https://', '').strip('/')
    if domain.startswith('www.'):
        domain = domain[4:]
    # remove any paths or query params
    domain = domain.split('/')[0].split(':')[0]

    parts = [re.sub(r'[^a-zA-Z]', '', p).lower() for p in name.strip().split() if p]
    if not parts:
        return []

    first = parts[0]
    last = parts[-1] if len(parts) > 1 else ''

    candidates = []
    if first and last:
        candidates.append(f"{first}.{last}@{domain}")
        candidates.append(f"{first}{last[0]}@{domain}")
        candidates.append(f"{first[0]}{last}@{domain}")
        candidates.append(f"{first}_{last}@{domain}")
        candidates.append(f"{first}@{domain}")
    elif first:
        candidates.append(f"{first}@{domain}")

def parse_hr_page(html: str, source_url: str = None) -> list[dict]:
    """
    Extracts public HR and recruiter contacts from HTML (Next.js server payload or DOM).
    """
    if not source_url:
        source_url = os.getenv("SCRAPER_HR_DIRECTORY_URL", "")
    contacts = []
    seen = set()

    # 1. Parse from Next.js server components payload (self.__next_f pushes)
    chunks = []
    for match in re.finditer(r'self\.__next_f\.push\(\[1,\s*"(.*?)"\]\)', html):
        raw = match.group(1)
        try:
            chunks.append(bytes(raw, "utf-8").decode("unicode_escape"))
        except Exception:
            chunks.append(raw)
            
    full_text = "".join(chunks)

    # Search for "preview": [...] array
    preview_match = re.search(r'"preview":\s*(\[\{.*?\}\])(?=,"|\})', full_text)
    if preview_match:
        try:
            raw_contacts = json.loads(preview_match.group(1))
            for item in raw_contacts:
                name = item.get('name', '').strip()
                company = item.get('company', '').strip()
                title = item.get('job_title', '').strip()
                linkedin = item.get('linkedin_url', '').strip()
                website = item.get('company_website', '').strip()
                location = item.get('location', '').strip()
                niche = item.get('company_niche', '').strip()

                if not name or not company:
                    continue

                dedupe_key = linkedin if linkedin else f"{name.lower()}|{company.lower()}"
                if dedupe_key in seen:
                    continue
                seen.add(dedupe_key)

                # Derive email if website exists
                email = None
                email_status = 'unverified'
                if website:
                    patterns = derive_email_patterns(name, website)
                    if patterns:
                        email = patterns[0]
                        email_status = 'pattern_derived'

                contacts.append({
                    'name': name,
                    'title': title or 'Talent Acquisition',
                    'company': company,
                    'company_website': website,
                    'company_niche': niche,
                    'location': location,
                    'linkedin_url': linkedin,
                    'email': email,
                    'email_status': email_status,
                    'source_url': source_url
                })
        except Exception as e:
            logger.warning(f"Error parsing preview JSON from /hr: {e}")

    # 2. DOM fallback using BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    cards = soup.find_all(lambda tag: tag.name in ['div', 'tr', 'li'] and tag.find('a', href=re.compile(r'linkedin\.com/in/')))
    for card in cards:
        link = card.find('a', href=re.compile(r'linkedin\.com/in/'))
        if not link:
            continue
        linkedin_url = link['href']
        name = link.get_text(strip=True) or 'Recruiter'

        text_nodes = [t.strip() for t in card.stripped_strings if t.strip() and t.strip() != name]
        title = text_nodes[0] if text_nodes else 'HR Professional'
        company = text_nodes[1] if len(text_nodes) > 1 else 'Company'

        dedupe_key = linkedin_url
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)

        contacts.append({
            'name': name,
            'title': title,
            'company': company,
            'company_website': None,
            'company_niche': None,
            'location': 'India',
            'linkedin_url': linkedin_url,
            'email': None,
            'email_status': 'unverified',
            'source_url': source_url
        })

    return contacts
