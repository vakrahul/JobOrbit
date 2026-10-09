import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import requests
import re
import json
from scraper.config import REQUEST_HEADERS

try:
    r = requests.get('https://joborbit-upstream.app/research', headers=REQUEST_HEADERS, timeout=15)
    print('Status:', r.status_code, 'Length:', len(r.text))
    
    with open('research_sample.html', 'w', encoding='utf-8') as f:
        f.write(r.text)
        
    emails = re.findall(r'mailto:([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', r.text)
    print(f'Emails found: {len(emails)}')
    print('Sample emails:', emails[:5])
    
    # Check for next data or JSON
    chunks = []
    for match in re.finditer(r'self\.__next_f\.push\(\[1,\s*"(.*?)"\]\)', r.text):
        try:
            chunks.append(bytes(match.group(1), "utf-8").decode("unicode_escape"))
        except Exception:
            chunks.append(match.group(1))
    full_text = "".join(chunks)
    print(f'Extracted next stream chunks length: {len(full_text)}')
    
    # Search for professor names or data keys
    sample_profs = re.findall(r'Dr\.\s+[A-Za-z\s.]+|Prof\.\s+[A-Za-z\s.]+', full_text or r.text)
    print('Sample prof mentions:', sample_profs[:8])

except Exception as e:
    print('Error:', e)
