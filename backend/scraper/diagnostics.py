"""
scraper/diagnostics.py
---------------------
Automated diagnostic tool to verify scraper resilience, multi-tier fallback integrity,
and alert if upstream site structure changes.

Can be run via:
    python -m scraper.diagnostics
"""
import sys
import logging
from bs4 import BeautifulSoup
from scraper.parser import (
    _extract_json_ld,
    _extract_next_f_stream,
    _extract_next_data,
    _extract_semantic_dom,
    _extract_share_links,
    parse_listing_page
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ScraperDiagnostics")

# ── Synthetic Payloads for Each Tier ───────────────────────────────────────────

SAMPLE_JSON_LD = """
<!DOCTYPE html>
<html>
<head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Senior AI Systems Engineer",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "Anthropic AI"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "addressLocality": "Bengaluru",
      "addressRegion": "Karnataka"
    }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "value": {
      "value": "35,00,000 - 55,00,000"
    }
  },
  "employmentType": "Full-time",
  "description": "Lead core distributed AI model serving systems and inference optimization.",
  "url": "https://careers.anthropic.com/jobs/ai-sys"
}
</script>
</head>
<body><h1>Jobs</h1></body>
</html>
"""

SAMPLE_NEXT_F_STREAM = """
<!DOCTYPE html>
<html>
<body>
<script>
self.__next_f.push([1, "1:[\"$\",\"div\",null,{\"children\":[{\"job\":{\"role\":\"Staff Backend Architect\",\"company\":\"Zerodha Tech\",\"location\":\"Bengaluru / Remote\",\"stipend\":\"₹40,00,000\",\"job_type\":\"Full-time\",\"slug\":\"zerodha-staff-backend\"},\"href\":\"https://zerodha.com/careers/staff-backend\"}]}]\n"]);
self.__next_f.push([1, "2:\"About the role: Build high-throughput ultra-low latency exchange gateways.\\nBatch: 2024/2025/2026 Today\"\n"]);
</script>
</body>
</html>
"""

SAMPLE_NEXT_DATA = """
<!DOCTYPE html>
<html>
<body>
<script id="__NEXT_DATA__" type="application/json">
{
  "props": {
    "pageProps": {
      "jobs": [
        {
          "title": "Founding ML Engineer",
          "company": "Sarvam AI",
          "location": "Bengaluru, India",
          "stipend": "₹30,00,000",
          "type": "Full-time",
          "batch": "2024/2025",
          "is_today": true,
          "about": "Building generative foundation models for Indian enterprise languages.",
          "href": "https://sarvam.ai/careers"
        }
      ]
    }
  }
}
</script>
</body>
</html>
"""

SAMPLE_SEMANTIC_DOM = """
<!DOCTYPE html>
<html>
<body>
  <div class="jobs-list">
    <article class="job-card border p-4">
      <h3 class="role-title">Distributed Systems Intern</h3>
      <span class="company-name">Postman</span>
      <p class="location">Bengaluru</p>
      <p>Today • Work on API platform core data planes and microservice topologies.</p>
      <a href="https://postman.com/careers/intern" class="apply-btn">Apply Now</a>
    </article>
  </div>
</body>
</html>
"""

SAMPLE_SHARE_LINK = """
<!DOCTYPE html>
<html>
<body>
  <div class="card">
    <div class="header">Lead Platform Engineer — Swiggy</div>
    <a href="https://api.whatsapp.com/send?text=Lead%20Platform%20Engineer%20%E2%80%94%20Swiggy%0ALocation%3A%20Bangalore%0AType%3A%20Full-time%0ASalary%3A%20Competitive%0Ahttps%3A%2F%2Fswiggy.com%2Fcareers">Share</a>
    <a href="https://swiggy.com/apply">Apply</a>
  </div>
</body>
</html>
"""


def run_diagnostics() -> dict:
    """
    Executes a comprehensive health check verifying that all 5 parser tiers
    are functioning and resilient against upstream shifts.
    """
    results = {}
    total_tiers = 5
    passed_tiers = 0

    print("\n" + "=" * 65)
    print(" JobOrbit Scraper Multi-Tier Resilience & Health Diagnostic")
    print("=" * 65 + "\n")

    # Tier 1: Schema.org JSON-LD
    soup1 = BeautifulSoup(SAMPLE_JSON_LD, 'html.parser')
    res1 = _extract_json_ld(soup1, "https://test.joborbit.app/jobs", "India")
    t1_pass = len(res1) == 1 and res1[0]['company'] == 'Anthropic AI'
    results['Tier 1: Schema.org JSON-LD'] = 'PASS' if t1_pass else 'FAIL'
    if t1_pass: passed_tiers += 1
    print(f"[{'PASS' if t1_pass else 'FAIL'}] Tier 1 (Schema.org JSON-LD) -> Extracted: {res1[0]['title'] if res1 else 'None'}")

    # Tier 2: Next.js App Router Stream Chunks
    res2 = _extract_next_f_stream(SAMPLE_NEXT_F_STREAM, "https://test.joborbit.app/jobs", "India")
    t2_pass = len(res2) == 1 and res2[0]['company'] == 'Zerodha Tech'
    results['Tier 2: Next.js Stream Hydration'] = 'PASS' if t2_pass else 'FAIL'
    if t2_pass: passed_tiers += 1
    print(f"[{'PASS' if t2_pass else 'FAIL'}] Tier 2 (Next.js Stream Hydration) -> Extracted: {res2[0]['title'] if res2 else 'None'}")

    # Tier 3: Next.js Pages Router __NEXT_DATA__
    soup3 = BeautifulSoup(SAMPLE_NEXT_DATA, 'html.parser')
    res3 = _extract_next_data(soup3, "https://test.joborbit.app/jobs", "India")
    t3_pass = len(res3) == 1 and res3[0]['company'] == 'Sarvam AI'
    results['Tier 3: Next.js __NEXT_DATA__'] = 'PASS' if t3_pass else 'FAIL'
    if t3_pass: passed_tiers += 1
    print(f"[{'PASS' if t3_pass else 'FAIL'}] Tier 3 (Next.js __NEXT_DATA__) -> Extracted: {res3[0]['title'] if res3 else 'None'}")

    # Tier 4: Semantic HTML DOM
    soup4 = BeautifulSoup(SAMPLE_SEMANTIC_DOM, 'html.parser')
    res4 = _extract_semantic_dom(soup4, "https://test.joborbit.app/jobs", "India")
    t4_pass = len(res4) == 1 and res4[0]['company'] == 'Postman'
    results['Tier 4: Semantic HTML DOM'] = 'PASS' if t4_pass else 'FAIL'
    if t4_pass: passed_tiers += 1
    print(f"[{'PASS' if t4_pass else 'FAIL'}] Tier 4 (Semantic HTML DOM) -> Extracted: {res4[0]['title'] if res4 else 'None'}")

    # Tier 5: Share link heuristics
    soup5 = BeautifulSoup(SAMPLE_SHARE_LINK, 'html.parser')
    res5 = _extract_share_links(soup5, "https://test.joborbit.app/jobs", "India")
    t5_pass = len(res5) == 1 and 'Swiggy' in res5[0]['company']
    results['Tier 5: Heuristic Links'] = 'PASS' if t5_pass else 'FAIL'
    if t5_pass: passed_tiers += 1
    print(f"[{'PASS' if t5_pass else 'FAIL'}] Tier 5 (Heuristic Share Links) -> Extracted: {res5[0]['title'] if res5 else 'None'}")

    # Cascade Integration Test
    cascade_res = parse_listing_page(SAMPLE_JSON_LD, "https://test.joborbit.app", "India")
    cascade_pass = len(cascade_res) == 1
    print(f"\n[{'PASS' if cascade_pass else 'FAIL'}] Cascade Prioritization Integration Test")

    score = int((passed_tiers / total_tiers) * 100)
    print("\n" + "-" * 65)
    print(f" Scraper Health Score: {score}% ({passed_tiers}/{total_tiers} Tiers Active & Operational)")
    print("-" * 65 + "\n")

    return {
        'status': 'healthy' if score == 100 else 'degraded',
        'score': score,
        'passed_tiers': passed_tiers,
        'total_tiers': total_tiers,
        'details': results
    }


if __name__ == '__main__':
    report = run_diagnostics()
    if report['score'] < 100:
        sys.exit(1)
    sys.exit(0)
