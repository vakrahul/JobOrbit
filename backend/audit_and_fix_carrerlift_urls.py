import sqlite3
import re
import urllib.parse

db_path = 'data/joborbit.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT COUNT(*) FROM jobs")
total = c.fetchone()[0]

c.execute("SELECT COUNT(*) FROM jobs WHERE apply_url LIKE '%carrerlift%' OR apply_url LIKE '%careerlift%'")
carrerlift_matches = c.fetchone()[0]

print(f"Total jobs in DB: {total}")
print(f"Jobs with carrerlift in apply_url: {carrerlift_matches}")

c.execute("SELECT COUNT(*) FROM jobs WHERE snippet LIKE '%carrerlift%' OR snippet LIKE '%careerlift%'")
snip_count = c.fetchone()[0]

c.execute("SELECT COUNT(*) FROM jobs WHERE description LIKE '%carrerlift%' OR description LIKE '%careerlift%'")
desc_count = c.fetchone()[0]

print(f"\nMentions in snippet: {snip_count}")
print(f"Mentions in description: {desc_count}")

if desc_count > 0:
    c.execute("SELECT id, company, title, substr(description, 1, 200) FROM jobs WHERE description LIKE '%carrerlift%' OR description LIKE '%careerlift%' LIMIT 5")
    for r in c.fetchall():
        print(f"ID {r[0]} | {r[1]} - {r[2]}: {r[3]}")

conn.close()
