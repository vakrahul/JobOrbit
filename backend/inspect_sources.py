import sqlite3

conn = sqlite3.connect('data/joborbit.db')
c = conn.cursor()

c.execute("SELECT source, COUNT(*) FROM jobs GROUP BY source")
print("Sources distribution:")
for r in c.fetchall():
    print(f"  {r[0]}: {r[1]} jobs")

print("\nBreakdown of jobs with carrerlift in apply_url:")
c.execute("SELECT source, COUNT(*) FROM jobs WHERE apply_url LIKE '%carrerlift%' OR apply_url LIKE '%careerlift%' GROUP BY source")
for r in c.fetchall():
    print(f"  {r[0]}: {r[1]} jobs")

print("\nBreakdown of jobs with carrerlift in detail_url:")
c.execute("SELECT source, COUNT(*) FROM jobs WHERE detail_url LIKE '%carrerlift%' OR detail_url LIKE '%careerlift%' GROUP BY source")
for r in c.fetchall():
    print(f"  {r[0]}: {r[1]} jobs")

print("\nBreakdown of jobs with carrerlift in source_url:")
c.execute("SELECT source, COUNT(*) FROM jobs WHERE source_url LIKE '%carrerlift%' OR source_url LIKE '%careerlift%' GROUP BY source")
for r in c.fetchall():
    print(f"  {r[0]}: {r[1]} jobs")

conn.close()
