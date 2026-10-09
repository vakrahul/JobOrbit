import json, re

with open('prep_sample.html', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'<script type="application/ld\+json">([^<]+)</script>', text):
    try:
        data = json.loads(m.group(1))
        if data.get('@type') == 'FAQPage':
            print("Found FAQPage! Count:", len(data.get('mainEntity', [])))
            for q in data.get('mainEntity', [])[:3]:
                print("\nQ:", q.get('name'))
                print("A:", q.get('acceptedAnswer', {}).get('text'))
    except Exception as e:
        print("Error:", e)
