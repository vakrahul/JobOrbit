from bs4 import BeautifulSoup
import re, json

with open('research_sample.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
mailto_tags = soup.find_all('a', href=re.compile(r'^mailto:'))
print(f'Total mailto tags in HTML: {len(mailto_tags)}')

for tag in mailto_tags[:5]:
    email = tag['href'].replace('mailto:', '')
    if 'upstream_feed' in email:
        continue
    # find parent card
    card = tag.find_parent(lambda p: p.name in ['div', 'article', 'li'] and len(p.get_text(strip=True)) > 40)
    print('---')
    print('Email:', email)
    if card:
        print('Card text:', " | ".join(card.stripped_strings)[:200])
