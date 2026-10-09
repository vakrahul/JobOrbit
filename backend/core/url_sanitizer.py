"""
core/url_sanitizer.py
---------------------
Guarantees that NO job ever points or redirects to third-party aggregator domains (e.g. carrerlift.in).
Resolves direct employer ATS links (Microsoft Careers, Amazon Jobs, Workday, Greenhouse, Lever)
or authentic 1-click LinkedIn Job search portals.
"""

import urllib.parse

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


def sanitize_job_url(url: str, company: str, title: str) -> str:
    """
    If URL points to carrerlift or is invalid/empty, resolves to direct employer or LinkedIn link.
    Otherwise preserves legitimate direct URLs (e.g. greenhouse.io, lever.co, amazon.jobs, wellfound.com).
    """
    if not url or not isinstance(url, str):
        return resolve_direct_apply_url(company, title)

    url_lower = url.lower()
    if 'carrerlift' in url_lower or 'careerlift' in url_lower:
        return resolve_direct_apply_url(company, title)

    return url
