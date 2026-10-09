"""
sanitize_db.py
Purges all references to carrerlift.in and careerlift from backend/data/joborbit.db.
Replaces with official JobOrbit domains and branding.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'joborbit.db')

def sanitize_database():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Beginning database sanitization...")

    # 1. Update jobs table
    cur.execute("""
        UPDATE jobs
        SET apply_url = REPLACE(apply_url, 'https://www.carrerlift.in', 'https://joborbit.in'),
            detail_url = REPLACE(detail_url, 'https://www.carrerlift.in', 'https://joborbit.in'),
            source_url = REPLACE(source_url, 'https://www.carrerlift.in', 'https://joborbit.in'),
            source = REPLACE(source, 'carrerlift', 'joborbit')
    """)
    cur.execute("""
        UPDATE jobs
        SET source = REPLACE(source, 'carrer', 'joborbit')
        WHERE source LIKE '%carrer%'
    """)
    print(f"Jobs updated: {cur.rowcount} rows modified.")

    # 2. Update hr_contacts table
    cur.execute("""
        UPDATE hr_contacts
        SET source_url = REPLACE(source_url, 'https://www.carrerlift.in', 'https://joborbit.in')
        WHERE source_url LIKE '%carrer%'
    """)
    print(f"HR contacts updated: {cur.rowcount} rows modified.")

    # 3. Update professor_contacts table
    cur.execute("""
        UPDATE professor_contacts
        SET source_url = REPLACE(source_url, 'https://www.carrerlift.in', 'https://joborbit.in')
        WHERE source_url LIKE '%carrer%'
    """)
    print(f"Professor contacts updated: {cur.rowcount} rows modified.")

    # 4. Update prep_questions table
    cur.execute("""
        UPDATE prep_questions
        SET answer = REPLACE(REPLACE(answer, 'Career Lift', 'JobOrbit'), 'careerlift', 'joborbit')
        WHERE answer LIKE '%careerlift%' OR answer LIKE '%Career Lift%'
    """)
    print(f"Prep questions updated: {cur.rowcount} rows modified.")

    # 5. Update scrape_logs table if any
    try:
        cur.execute("""
            UPDATE scrape_logs
            SET scraper_name = REPLACE(scraper_name, 'carrerlift', 'joborbit')
            WHERE scraper_name LIKE '%carrerlift%'
        """)
    except Exception:
        pass

    conn.commit()

    # Verify counts
    print("\n--- Verification ---")
    cur.execute("SELECT count(*) FROM jobs WHERE apply_url LIKE '%carrer%' OR detail_url LIKE '%carrer%' OR source_url LIKE '%carrer%'")
    print("Remaining carrer references in jobs:", cur.fetchone()[0])

    cur.execute("SELECT count(*) FROM hr_contacts WHERE source_url LIKE '%carrer%'")
    print("Remaining carrer references in hr_contacts:", cur.fetchone()[0])

    cur.execute("SELECT count(*) FROM professor_contacts WHERE source_url LIKE '%carrer%'")
    print("Remaining carrer references in professor_contacts:", cur.fetchone()[0])

    cur.execute("SELECT count(*) FROM prep_questions WHERE answer LIKE '%careerlift%'")
    print("Remaining careerlift references in prep_questions:", cur.fetchone()[0])

    conn.close()
    print("Database sanitization complete!")

if __name__ == '__main__':
    sanitize_database()
