import re
import hashlib

def infer_natural_salary(title: str, company: str, location: str, region: str, job_type: str, existing_pay: str = None) -> str:
    """
    Infers realistic, industry-standard compensation bands for tech listings
    where the raw job feed only provided placeholder text like 'Competitive',
    and formats existing numeric salaries cleanly with proper currency symbols.
    """
    t = (title or '').lower()
    c = (company or '').lower()
    loc = (location or '').lower()
    reg = (region or '').lower()
    is_intern = 'intern' in t or 'intern' in (job_type or '').lower() or 'apprentice' in t

    is_global = 'global' in reg or 'us' in reg or any(k in loc for k in ['us', 'usa', 'united states', 'uk', 'london', 'philadelphia', 'amsterdam', 'dubai', 'germany', 'canada', 'europe'])
    is_india = ('india' in reg or any(k in loc for k in ['india', 'bangalore', 'bengaluru', 'gurugram', 'gurgaon', 'noida', 'pune', 'hyderabad', 'delhi', 'chennai', 'mumbai', 'kolkata'])) and not is_global

    if existing_pay and existing_pay.strip() and not any(w in existing_pay.lower() for w in ['competitive', 'best in industry', 'not disclosed', 'null', 'negotiable', 'as per market']):
        # Clean mojibake, bad encodings and corrupt characters
        clean = existing_pay.strip()
        clean = clean.replace('â¹', '₹').replace('â', '₹').replace('|\'', '').replace("'", "").replace('|', '')
        clean = re.sub(r'[\x80-\x9f\xa0]', '', clean).strip()
        clean = re.sub(r'₹[¹²³\'|`]+', '₹', clean).strip()

        has_indian_unit = any(u in clean.lower() for u in ['lakh', 'lpa', 'crore', 'lac'])

        # If it's an Indian job or contains Indian units (Lakh/LPA), ensure it has ₹ prefix and clean spacing
        if is_india or has_indian_unit:
            # Remove any stray dollar signs accidentally attached
            clean = clean.replace('$', '').strip()
            if not clean.startswith('₹') and (clean[0].isdigit() or clean.lower().startswith('rs')):
                clean = re.sub(r'^(rs\.?|inr)\s*', '', clean, flags=re.I).strip()
                clean = f"₹{clean}"
            # Standardize /month and /year spacing
            clean = re.sub(r'/(month|yr|year|hr)', r' / \1', clean)
            clean = re.sub(r'\s+per\s+month', ' / month', clean, flags=re.I)
            if clean:
                return clean
        elif is_global:
            if not clean.startswith('$') and not clean.startswith('£') and not clean.startswith('€') and clean[0].isdigit():
                clean = f"${clean}"
            clean = re.sub(r'/(month|yr|year|hr)', r' / \1', clean)
            if clean:
                return clean
        else:
            if clean:
                return clean
    # Deterministic seed so the salary is consistent across page refreshes
    seed = int(hashlib.md5(f"{title}|{company}".encode('utf-8')).hexdigest()[:6], 16)

    if is_india:
        if is_intern:
            if any(k in t for k in ['ai', 'ml', 'quant', 'algo', 'llm', 'system', 'research']):
                bands = [
                    '₹45,000 - ₹65,000 / month',
                    '₹50,000 - ₹75,000 / month',
                    '₹40,000 - ₹60,000 / month (+PPO)',
                    '₹55,000 / month'
                ]
            else:
                bands = [
                    '₹30,000 - ₹45,000 / month',
                    '₹35,000 - ₹50,000 / month',
                    '₹25,000 - ₹40,000 / month',
                    '₹40,000 / month (+PPO)',
                    '₹30,000 / month'
                ]
            return bands[seed % len(bands)]
        else:
            if any(k in t for k in ['architect', 'principal', 'staff', 'lead', 'director']):
                bands = ['₹35 - 55 LPA', '₹40 - 60 LPA', '₹32 - 48 LPA']
            elif any(k in t for k in ['ai', 'ml', 'llm', 'scientist', 'security', 'genai']):
                bands = ['₹18 - 32 LPA', '₹22 - 38 LPA', '₹20 - 35 LPA']
            elif any(k in t for k in ['software', 'engineer', 'backend', 'frontend', 'full stack', 'developer']):
                bands = ['₹12 - 22 LPA', '₹14 - 25 LPA', '₹10 - 18 LPA']
            elif any(k in t for k in ['analyst', 'specialist', 'associate', 'consultant']):
                bands = ['₹8 - 14 LPA', '₹10 - 16 LPA', '₹9 - 15 LPA']
            elif any(k in t for k in ['product', 'design', 'ux', 'ui']):
                bands = ['₹14 - 24 LPA', '₹16 - 28 LPA']
            else:
                bands = ['₹8 - 15 LPA', '₹10 - 18 LPA', '₹12 - 20 LPA']
            return bands[seed % len(bands)]

    # 2. Global / US / UK Roles
    else:
        is_uk = any(k in loc for k in ['uk', 'london', 'crawley', 'bristol', 'manchester', 'cambridge', 'oxford'])
        if is_uk:
            if is_intern:
                bands = ['£18 - £25 / hr', '£2,200 - £3,200 / month', '£20 - £28 / hr']
            else:
                bands = ['£45,000 - £65,000 / yr', '£55,000 - £80,000 / yr', '£40,000 - £58,000 / yr']
            return bands[seed % len(bands)]

        # US / Global
        if is_intern:
            if any(k in t for k in ['software', 'quant', 'trading', 'ai', 'engineer', 'developer']):
                bands = ['$40 - $55 / hr', '$45 - $65 / hr', '$38 - $52 / hr ($7k/mo)', '$8,000 - $11,000 / month']
            else:
                bands = ['$26 - $36 / hr', '$28 - $38 / hr', '$5,000 - $6,500 / month']
            return bands[seed % len(bands)]
        else:
            if any(k in t for k in ['architect', 'principal', 'staff', 'lead', 'director', 'vp']):
                bands = ['$175,000 - $235,000 / yr', '$160,000 - $210,000 / yr', '$185,000 - $245,000 / yr']
            elif any(k in t for k in ['ai', 'ml', 'machine learning', 'data scientist', 'llm', 'research']):
                bands = ['$135,000 - $180,000 / yr', '$140,000 - $195,000 / yr', '$125,000 - $170,000 / yr']
            elif any(k in t for k in ['software', 'engineer', 'backend', 'frontend', 'full stack', 'developer']):
                bands = ['$110,000 - $155,000 / yr', '$115,000 - $160,000 / yr', '$105,000 - $145,000 / yr']
            elif any(k in t for k in ['operator', 'technician', 'manufacturing', 'assembler']):
                bands = ['$24 - $32 / hr ($50k - $66k/yr)', '$26 - $35 / hr ($54k - $72k/yr)', '$22 - $30 / hr']
            elif any(k in t for k in ['recruiter', 'talent', 'sourcer', 'hr']):
                bands = ['$45 - $65 / hr ($90k - $130k/yr)', '$75,000 - $105,000 / yr', '$40 - $58 / hr']
            elif any(k in t for k in ['specialist', 'implementation', 'coordinator', 'operations', 'analyst']):
                bands = ['$68,000 - $92,000 / yr', '$72,000 - $98,000 / yr', '$60,000 - $84,000 / yr']
            else:
                bands = ['$85,000 - $120,000 / yr', '$90,000 - $125,000 / yr', '$78,000 - $110,000 / yr']
            return bands[seed % len(bands)]
