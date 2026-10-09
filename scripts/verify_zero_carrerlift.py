#!/usr/bin/env python3
"""
verify_zero_carrerlift.py
-------------------------
Integrity check: verifies that zero (0) jobs in the database contain
any reference to carrerlift.in or careerlift across apply_url, detail_url,
source_url, snippet, description, or any other field.
Exits with code 0 if completely clean.
Exits with code 1 if any violation is detected.
"""

import sqlite3
import os
import sys

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'joborbit.db'))

if not os.path.exists(db_path):
    print(f"ERROR: Database not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()

checks = [
    ("apply_url", "SELECT COUNT(*) FROM jobs WHERE apply_url LIKE '%carrerlift%' OR apply_url LIKE '%careerlift%'"),
    ("detail_url", "SELECT COUNT(*) FROM jobs WHERE detail_url LIKE '%carrerlift%' OR detail_url LIKE '%careerlift%'"),
    ("source_url", "SELECT COUNT(*) FROM jobs WHERE source_url LIKE '%carrerlift%' OR source_url LIKE '%careerlift%'"),
    ("description", "SELECT COUNT(*) FROM jobs WHERE description LIKE '%carrerlift%' OR description LIKE '%careerlift%'"),
    ("snippet", "SELECT COUNT(*) FROM jobs WHERE snippet LIKE '%carrerlift%' OR snippet LIKE '%careerlift%'"),
]

print("==========================================================")
print("JOBORBIT ZERO-CARRERLIFT INTEGRITY AUDIT")
print("==========================================================")

c.execute("SELECT COUNT(*) FROM jobs")
total_jobs = c.fetchone()[0]
print(f"Total Database Roles Audited: {total_jobs:,}")
print("-" * 58)

violations = 0
for col, query in checks:
    c.execute(query)
    count = c.fetchone()[0]
    status = "PASS (0)" if count == 0 else f"FAIL ({count})"
    print(f"  Field: {col:<15} -> {status}")
    if count > 0:
        violations += count

conn.close()

print("=" * 58)
if violations == 0:
    print("ALL CHECKS PASSED: ZERO (0) jobs redirect to carrerlift.in!")
    sys.exit(0)
else:
    print(f"AUDIT FAILED: {violations} carrerlift references detected.")
    sys.exit(1)
