import requests
import re
import json

url = 'https://www.carrerlift.in/jobs/kamlax-global-technologies-l1-product-support-engineer-pune-fe168e8a'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}
r = requests.get(url, headers=headers)
print("Page length:", len(r.text))

# Check for JSON-LD schemas
ld_matches = re.findall(r'<script type="application/ld\+json">(.*?)</script>', r.text, re.DOTALL)
for ld in ld_matches:
    print("Found JSON-LD:")
    try:
        data = json.loads(ld)
        print("  name:", data.get("title") or data.get("name"))
        print("  hiringOrganization:", data.get("hiringOrganization"))
        print("  url:", data.get("url"))
        print("  directApply:", data.get("directApply"))
    except Exception as e:
        print("  LD parse error:", e)

# Also check for RSC payload
rsc_url = url + "?_rsc=1"
r_rsc = requests.get(rsc_url, headers=headers)
print("RSC response len:", len(r_rsc.text))
urls = set(re.findall(r'https?://[a-zA-Z0-9\.\-_/]+', r_rsc.text))
for u in urls:
    if 'carrerlift' not in u and 'schema.org' not in u and 'w3.org' not in u and 'vercel' not in u:
        print("RSC external url:", u)
