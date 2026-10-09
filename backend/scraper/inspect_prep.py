import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import requests
import re
from scraper.config import REQUEST_HEADERS

r = requests.get('https://joborbit-upstream.app/prep/ai-engineer/agentic-ai', headers=REQUEST_HEADERS)
print('Page size:', len(r.text))
with open('prep_sample.html', 'w', encoding='utf-8') as f:
    f.write(r.text)

print('Saved prep_sample.html')
