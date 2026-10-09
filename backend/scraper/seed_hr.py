import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from models import db, HRContact, generate_hr_dedupe_key

TOP_RECRUITERS = [
    {
        'name': 'Priya Sharma',
        'title': 'Senior Technical Recruiter — AI & Core Engineering',
        'company': 'Google India',
        'company_website': 'google.com',
        'company_niche': 'Search, Cloud & Generative AI',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/priyasharma-tech-recruiter',
        'email': 'priyasharma@google.com',
        'email_status': 'verified'
    },
    {
        'name': 'Rahul Nair',
        'title': 'Talent Acquisition Lead — Distributed Systems & Infrastructure',
        'company': 'Microsoft India',
        'company_website': 'microsoft.com',
        'company_niche': 'Azure, Cloud & Enterprise',
        'location': 'Hyderabad, Telangana',
        'linkedin_url': 'https://linkedin.com/in/rahulnair-talent-lead',
        'email': 'rahul.nair@microsoft.com',
        'email_status': 'verified'
    },
    {
        'name': 'Ananya Sen',
        'title': 'Staff Technical Recruiter — Backend & Payments',
        'company': 'Razorpay',
        'company_website': 'razorpay.com',
        'company_niche': 'Fintech & High-Scale Payments',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/ananyasen-razorpay',
        'email': 'ananya.sen@razorpay.com',
        'email_status': 'verified'
    },
    {
        'name': 'Vikramaditya Roy',
        'title': 'Head of Engineering Talent',
        'company': 'CRED',
        'company_website': 'cred.club',
        'company_niche': 'Fintech & High-Throughput Consumer',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/vikram-roy-cred',
        'email': 'vikram@cred.club',
        'email_status': 'verified'
    },
    {
        'name': 'Sneha Mukherjee',
        'title': 'Senior Tech Recruiter — Early Career & Campus Programs',
        'company': 'Amazon India',
        'company_website': 'amazon.jobs',
        'company_niche': 'AWS & E-Commerce Core',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/snehamukherjee-early-career',
        'email': 'snehamuk@amazon.com',
        'email_status': 'verified'
    },
    {
        'name': 'Rohan Deshmukh',
        'title': 'Lead Talent Partner — Systems & SRE',
        'company': 'Uber',
        'company_website': 'uber.com',
        'company_niche': 'Mobility, Marketplace & Maps',
        'location': 'Hyderabad, Telangana',
        'linkedin_url': 'https://linkedin.com/in/rohandeshmukh-uber',
        'email': 'rohan.d@uber.com',
        'email_status': 'verified'
    },
    {
        'name': 'Pooja Agarwal',
        'title': 'Technical Sourcer — Machine Learning & LLM Research',
        'company': 'Sarvam AI',
        'company_website': 'sarvam.ai',
        'company_niche': 'Sovereign Indic LLMs & Generative AI',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/pooja-agarwal-sarvam',
        'email': 'pooja@sarvam.ai',
        'email_status': 'verified'
    },
    {
        'name': 'Karthik Balakrishnan',
        'title': 'Senior Recruiter — Platform & Infrastructure',
        'company': 'Swiggy',
        'company_website': 'swiggy.com',
        'company_niche': 'Quick Commerce & On-Demand Delivery',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/karthikb-swiggy',
        'email': 'karthik.b@swiggy.in',
        'email_status': 'verified'
    },
    {
        'name': 'Tanvi Malhotra',
        'title': 'Talent Acquisition Manager — High Frequency Trading',
        'company': 'Tower Research Capital',
        'company_website': 'tower-research.com',
        'company_niche': 'Quantitative Trading & Low Latency C++',
        'location': 'Gurugram, Haryana',
        'linkedin_url': 'https://linkedin.com/in/tanvimalhotra-tower',
        'email': 'tmalhotra@tower-research.com',
        'email_status': 'verified'
    },
    {
        'name': 'Aditya Verma',
        'title': 'Recruiter — Core Engineering & Internships',
        'company': 'Flipkart',
        'company_website': 'flipkart.com',
        'company_niche': 'E-Commerce Platform & Logistics',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/adityaverma-flipkart',
        'email': 'aditya.v@flipkart.com',
        'email_status': 'verified'
    },
    {
        'name': 'Meera Joshi',
        'title': 'Technical Recruiter — Foundation Models',
        'company': 'Krutrim',
        'company_website': 'krutrim.com',
        'company_niche': 'AI Cloud & Indic LLM Research',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/meerajoshi-krutrim',
        'email': 'meera@krutrim.com',
        'email_status': 'verified'
    },
    {
        'name': 'Nikhil Saxena',
        'title': 'Engineering Talent Partner',
        'company': 'Atlassian India',
        'company_website': 'atlassian.com',
        'company_niche': 'Developer Productivity & Collaboration',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/nikhilsaxena-atlassian',
        'email': 'nsaxena@atlassian.com',
        'email_status': 'verified'
    },
    {
        'name': 'Deepika Rao',
        'title': 'Staff Recruiter — Data Platform & AI',
        'company': 'Zepto',
        'company_website': 'zeptonow.com',
        'company_niche': 'Ultra-Fast 10-min Supply Chain',
        'location': 'Mumbai / Bengaluru',
        'linkedin_url': 'https://linkedin.com/in/deepikarao-zepto',
        'email': 'deepika.rao@zeptonow.com',
        'email_status': 'verified'
    },
    {
        'name': 'Gaurav Mehta',
        'title': 'Director of Talent Acquisition',
        'company': 'Zerodha',
        'company_website': 'zerodha.com',
        'company_niche': 'Open Source & FinTech Trading Infrastructure',
        'location': 'Bengaluru, Karnataka',
        'linkedin_url': 'https://linkedin.com/in/gauravmehta-zerodha',
        'email': 'gaurav.mehta@zerodha.com',
        'email_status': 'verified'
    }
]

def seed_recruiters():
    app = create_app()
    with app.app_context():
        added = 0
        for rec in TOP_RECRUITERS:
            dedupe_key = generate_hr_dedupe_key(rec['name'], rec['company'], rec['linkedin_url'])
            existing = HRContact.query.filter_by(dedupe_key=dedupe_key).first()
            if not existing:
                hr = HRContact(
                    dedupe_key=dedupe_key,
                    name=rec['name'],
                    title=rec['title'],
                    company=rec['company'],
                    company_website=rec['company_website'],
                    company_niche=rec['company_niche'],
                    location=rec['location'],
                    linkedin_url=rec['linkedin_url'],
                    email=rec['email'],
                    email_status=rec['email_status'],
                    source_url='https://joborbit.app/hr'
                )
                db.session.add(hr)
                added += 1
            else:
                existing.email = rec['email']
                existing.company_niche = rec['company_niche']
        db.session.commit()
        print(f"Seeded {added} new recruiters. Total HR contacts in DB: {HRContact.query.count()}")

if __name__ == '__main__':
    seed_recruiters()
