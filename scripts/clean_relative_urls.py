import sqlite3
import urllib.parse

def clean_urls():
    conn = sqlite3.connect('backend/data/joborbit.db')
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, company, title, apply_url, source_url 
        FROM jobs 
        WHERE apply_url LIKE '/apply/%' 
           OR source_url LIKE '/apply/%' 
           OR apply_url LIKE '/jobs/%'
    """)
    rows = cursor.fetchall()
    print(f"Found {len(rows)} legacy relative rows to update.")

    updates = []
    for jid, comp, tit, a_url, s_url in rows:
        comp_clean = (comp or '').strip()
        tit_clean = (tit or '').strip()
        search_kw = urllib.parse.quote(f"{comp_clean} {tit_clean}".strip())
        new_url = f"https://www.linkedin.com/jobs/search/?keywords={search_kw}"
        
        new_a = new_url if (a_url and a_url.startswith('/')) else a_url
        new_s = new_url if (s_url and s_url.startswith('/')) else s_url
        updates.append((new_a, new_s, jid))

    cursor.executemany("""
        UPDATE jobs 
        SET apply_url = ?, source_url = ?, updated_at = datetime('now') 
        WHERE id = ?
    """, updates)
    conn.commit()

    cursor.execute("SELECT count(id) FROM jobs WHERE apply_url LIKE '/apply/%'")
    remaining = cursor.fetchone()[0]
    print(f"Update complete! Remaining /apply/ URLs in DB: {remaining}")
    conn.close()

if __name__ == '__main__':
    clean_urls()
