import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import requests
from bs4 import BeautifulSoup
import re
import hashlib
from scraper.config import REQUEST_HEADERS

def parse_research_page(html):
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    
    # Each professor card is in a container with p-5 or rounded-xl
    for h2 in soup.find_all('h2'):
        name = h2.get_text(strip=True)
        if not name or len(name) > 60:
            continue
            
        card = h2.find_parent(lambda p: p.name == 'div' and ('rounded-xl' in (p.get('class') or []) or 'border' in (p.get('class') or [])))
        if not card:
            continue
            
        # Email
        mailto = card.find('a', href=re.compile(r'^mailto:'))
        if not mailto:
            continue
        email = mailto['href'].replace('mailto:', '').strip()
        if 'upstream_feed' in email.lower():
            continue
            
        # Department
        dept_p = h2.find_next_sibling('p')
        department = dept_p.get_text(strip=True) if dept_p else 'Engineering / Science'
        
        # Institute
        inst_span = card.find('span', class_=re.compile(r'truncate'))
        institute = inst_span.get_text(strip=True) if inst_span else ''
        if not institute:
            # Look for IIT/IISc in card text
            match = re.search(r'(IIT\s+[A-Za-z]+|IISc\s*[A-Za-z]*|IIIT\s+[A-Za-z]+|NIT\s+[A-Za-z]+)', card.get_text())
            if match:
                institute = match.group(1).strip()
            else:
                institute = 'IIT'
                
        # Research areas
        areas_h3 = card.find(lambda t: t.name in ['h3', 'h4', 'span'] and 'research' in t.get_text(strip=True).lower())
        research_areas = ''
        if areas_h3:
            areas_p = areas_h3.find_next_sibling('p')
            if areas_p:
                research_areas = areas_p.get_text(strip=True)
                
        # Lab or profile website link
        website_url = None
        for a in card.find_all('a', href=True):
            href = a['href']
            if href.startswith('http') and 'upstream_feed' not in href and 'mailto:' not in href:
                website_url = href
                break

        results.append({
            'name': name,
            'institute': institute,
            'department': department,
            'research_areas': research_areas,
            'email': email,
            'website_url': website_url
        })
        
    return results

if __name__ == '__main__':
    r = requests.get('https://joborbit-upstream.app/research', headers=REQUEST_HEADERS)
    profs = parse_research_page(r.text)
    print(f'Extracted {len(profs)} professors from page 1:')
    for p in profs[:3]:
        print(p)
