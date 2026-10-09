#!/usr/bin/env python3
"""
purge_and_fix_carrerlift_urls.py
================================
Zero-Tolerance Carrerlift Purge & Direct Apply Resolver:
1. Audits database for any URL containing 'carrerlift' or 'careerlift'.
2. Resolves each affected job to an authentic, direct employer careers portal
   or direct LinkedIn Jobs search URL (e.g., https://www.linkedin.com/jobs/search/?keywords=...).
3. Sanitizes apply_url, detail_url, and source_url across all records.
4. Verifies database has ZERO (0) references to carrerlift.
"""

import sqlite3
import urllib.parse
import re
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'joborbit.db')

COMPANY_ATS_PATTERNS = {
    'microsoft': 'https://careers.microsoft.com/us/en/search-results?keywords={title}',
    'google': 'https://www.google.com/about/careers/applications/jobs/results/?q={title}',
    'amazon': 'https://www.amazon.jobs/en/search?base_query={title}',
    'apple': 'https://jobs.apple.com/en-us/search?search={title}',
    'meta': 'https://www.metacareers.com/jobs?q={title}',
    'netflix': 'https://jobs.netflix.com/search?q={title}',
    'uber': 'https://www.uber.com/global/en/careers/list/?query={title}',
    'adobe': 'https://careers.adobe.com/us/en/search-results?keywords={title}',
    'accenture': 'https://www.accenture.com/in-en/careers/jobsearch?jk={title}',
    'visa': 'https://corporate.visa.com/en/careers.html#jobs',
    'salesforce': 'https://careers.salesforce.com/en/search-jobs/?k={title}',
    'intel': 'https://jobs.intel.com/en/search-jobs/{title}',
    'nvidia': 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q={title}',
    'cisco': 'https://jobs.cisco.com/jobs/SearchJobs/{title}',
    'oracle': 'https://careers.oracle.com/jobs/#/search?keyword={title}',
    'ibm': 'https://www.ibm.com/careers/search?q={title}',
    'goldman sachs': 'https://www.goldmansachs.com/careers/our-firm/index.html',
    'jpmorgan': 'https://careers.jpmorgan.com/global/en/home',
    'morgan stanley': 'https://morganstanley.tal.net/vx/lang-en-GB/appcentre-1/candidate/jobboard/vacancy/1/adv/',
    'swiggy': 'https://careers.swiggy.com/#/job-list?search={title}',
    'zomato': 'https://www.zomato.com/careers',
    'zepto': 'https://www.zeptonow.com/careers',
    'cred': 'https://careers.cred.club/',
    'flipkart': 'https://www.flipkartcareers.com/',
    'phonepe': 'https://www.phonepe.com/careers/',
    'razorpay': 'https://razorpay.com/jobs/',
    'meesho': 'https://www.meesho.io/jobs',
    'daimler': 'https://www.daimlertruck.com/en/career',
    'entegris': 'https://careers.entegris.com/search/?q={title}',
    'allstate': 'https://allstate.jobs/job-search/?keyword={title}',
}

def resolve_direct_apply_url(company: str, title: str) -> str:
    """Returns direct corporate careers page or direct LinkedIn job search URL."""
    c_lower = (company or '').lower().strip()
    t_clean = (title or '').strip()

    # Check top direct ATS patterns
    for key, template in COMPANY_ATS_PATTERNS.items():
        if key in c_lower:
            encoded_title = urllib.parse.quote(t_clean)
            return template.format(title=encoded_title)

    # Universal direct search: LinkedIn Jobs portal search
    query = f"{company} {t_clean}".strip()
    encoded_query = urllib.parse.quote(query)
    return f"https://www.linkedin.com/jobs/search/?keywords={encoded_query}"


def purge_and_sanitize(db_path: str = DB_PATH):
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    print("=" * 70)
    print("JOBORBIT CARRERLIFT PURGE & DIRECT ATS RESOLVER")
    print("=" * 70)

    # 1. Audit before
    c.execute("SELECT COUNT(*) FROM jobs")
    total_jobs = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM jobs WHERE apply_url LIKE '%carrerlift%' OR apply_url LIKE '%careerlift%'")
    apply_cl_before = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM jobs WHERE detail_url LIKE '%carrerlift%' OR detail_url LIKE '%careerlift%'")
    detail_cl_before = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM jobs WHERE source_url LIKE '%carrerlift%' OR source_url LIKE '%careerlift%'")
    source_cl_before = c.fetchone()[0]

    print(f"Total jobs in DB:                 {total_jobs}")
    print(f"Jobs with carrerlift in apply_url:  {apply_cl_before}")
    print(f"Jobs with carrerlift in detail_url: {detail_cl_before}")
    print(f"Jobs with carrerlift in source_url: {source_cl_before}")
    print("-" * 70)

    # 2. Fix apply_url
    c.execute("SELECT id, company, title FROM jobs WHERE apply_url LIKE '%carrerlift%' OR apply_url LIKE '%careerlift%'")
    affected_apply = c.fetchall()

    print(f"Transforming {len(affected_apply)} apply_urls into direct company/LinkedIn portals...")
    updated_apply_count = 0
    for job_id, company, title in affected_apply:
        direct_url = resolve_direct_apply_url(company, title)
        c.execute("UPDATE jobs SET apply_url = ?, apply_kind = 'external_direct' WHERE id = ?", (direct_url, job_id))
        updated_apply_count += 1

    # 3. Fix detail_url
    c.execute("UPDATE jobs SET detail_url = NULL WHERE detail_url LIKE '%carrerlift%' OR detail_url LIKE '%careerlift%'")
    updated_detail_count = c.rowcount

    # 4. Fix source_url
    c.execute("UPDATE jobs SET source_url = apply_url WHERE source_url LIKE '%carrerlift%' OR source_url LIKE '%careerlift%'")
    updated_source_count = c.rowcount

    conn.commit()

    # 5. Audit after
    c.execute("SELECT COUNT(*) FROM jobs WHERE apply_url LIKE '%carrerlift%' OR apply_url LIKE '%careerlift%'")
    apply_cl_after = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM jobs WHERE detail_url LIKE '%carrerlift%' OR detail_url LIKE '%careerlift%'")
    detail_cl_after = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM jobs WHERE source_url LIKE '%carrerlift%' OR source_url LIKE '%careerlift%'")
    source_cl_after = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM jobs WHERE description LIKE '%carrerlift%' OR description LIKE '%careerlift%'")
    desc_cl_after = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM jobs WHERE snippet LIKE '%carrerlift%' OR snippet LIKE '%careerlift%'")
    snip_cl_after = c.fetchone()[0]

    print("=" * 70)
    print("VERIFICATION AUDIT POST-PURGE:")
    print(f"  apply_url with carrerlift:  {apply_cl_after} (Target: 0)")
    print(f"  detail_url with carrerlift: {detail_cl_after} (Target: 0)")
    print(f"  source_url with carrerlift: {source_cl_after} (Target: 0)")
    print(f"  description mentions:       {desc_cl_after} (Target: 0)")
    print(f"  snippet mentions:           {snip_cl_after} (Target: 0)")
    print("=" * 70)

    # 6. Sample output of resolved URLs
    print("\nSAMPLE RESOLVED DIRECT APPLY URLS:")
    c.execute("SELECT id, company, title, apply_url FROM jobs WHERE id IN (7702, 7703, 7704, 7709, 7715, 7718, 7719)")
    for r in c.fetchall():
        print(f"  ID {r[0]} | [{r[1]}] {r[2]}")
        print(f"    -> {r[3]}")

    conn.close()

    if apply_cl_after == 0 and detail_cl_after == 0 and source_cl_after == 0:
        print("\nSUCCESS: 100% of jobs purged. ZERO jobs redirect to carrerlift.in!")
    else:
        print("\nWARNING: Some carrerlift references remain.")

if __name__ == '__main__':
    purge_and_sanitize()
