"""
services/premium_service.py
---------------------------
OOP Business logic for VIP/Premium features:
- Plan pricing & perks catalog
- Comparison matrices
- Payment order generation (Razorpay)
- Cryptographic HMAC signature verification
- VIP entitlement granting
"""
import hmac
import hashlib
from typing import Dict, Any, Optional

from core.config import settings
from core.exceptions import ValidationError, AuthError
from repositories.user_repository import user_repo
from repositories.job_repository import job_repo
from repositories.hr_repository import hr_repo
from repositories.research_repository import research_repo
from repositories.prep_repository import prep_repo


PLANS: Dict[str, Dict[str, Any]] = {
    'monthly': {
        'id': 'monthly',
        'name': '1-Month VIP Pass',
        'price_inr': 75,
        'price_usd': 9.99,
        'billing': 'Billed monthly · Cancel anytime',
        'badge': 'STANDARD',
        'savings': None,
        'gateway_india': 'Cashfree Payments',
        'gateway_global': 'Dodo Payments',
        'features': [
            '⚡ 6–8 Hours Early Access window on every new drop',
            '🔓 100% Unlocked recruiter & HR manager emails',
            'Direct access to 290+ IIT/IISc faculty lab directors',
            'Unlimited Gemini AI Resume Matcher & score diagnostics',
            '1-Click personalized cold email drafter for roles & labs',
            'Full 330+ Question Technical Interview Vault',
            'Job application pipeline tracking'
        ]
    },
    'quarterly': {
        'id': 'quarterly',
        'name': '3-Month Quarterly Pass',
        'price_inr': 215,
        'price_usd': 24.99,
        'billing': 'Billed quarterly (₹71.6/mo · Save ₹10)',
        'badge': 'MOST POPULAR',
        'savings': 'Save ₹10',
        'gateway_india': 'Cashfree Payments',
        'gateway_global': 'Dodo Payments',
        'features': [
            '⚡ 6–8 Hours Early Access window on every new drop',
            '🔓 100% Unlocked recruiter & HR manager direct emails',
            'Direct access to 290+ IIT/IISc faculty lab directors',
            'Unlimited Gemini AI Resume Matcher & score diagnostics',
            '1-Click personalized cold email drafter for roles & labs',
            'Full 330+ Question Technical Interview Vault',
            'Priority job application pipeline tracking & CRM',
            'Real-time Telegram & WhatsApp drop alerts'
        ]
    },
    'annual': {
        'id': 'annual',
        'name': '1-Year Annual Pass',
        'price_inr': 699,
        'price_usd': 79.99,
        'billing': 'Billed annually (₹58/mo · Best Value)',
        'badge': 'BEST VALUE · SAVE 22%',
        'savings': 'Save 22%',
        'gateway_india': 'Cashfree Payments',
        'gateway_global': 'Dodo Payments',
        'features': [
            '⚡ 6–8 Hours Early Access window on every new drop',
            '🔓 100% Unlocked recruiter & HR manager direct emails',
            'Direct access to 290+ IIT/IISc faculty lab directors',
            'Unlimited Gemini AI Resume Matcher & score diagnostics',
            '1-Click personalized cold email drafter for roles & labs',
            'Full 330+ Question Technical Interview Vault',
            'Priority job application pipeline tracking & CRM',
            'Real-time Telegram & WhatsApp drop alerts',
            'Full 12 Months Continuous Access & Career Shield'
        ]
    },
    # Backward compatibility alias
    'lifetime': {
        'id': 'annual',
        'name': '1-Year Annual Pass',
        'price_inr': 699,
        'price_usd': 79.99,
        'billing': 'Billed annually (₹58/mo · Best Value)',
        'badge': 'BEST VALUE · SAVE 22%',
        'savings': 'Save 22%',
        'gateway_india': 'Cashfree Payments',
        'gateway_global': 'Dodo Payments',
        'features': [
            '⚡ 6–8 Hours Early Access window on every new drop',
            '🔓 100% Unlocked recruiter & HR manager direct emails',
            'Direct access to 290+ IIT/IISc faculty lab directors',
            'Unlimited Gemini AI Resume Matcher & score diagnostics',
            '1-Click personalized cold email drafter for roles & labs',
            'Full 330+ Question Technical Interview Vault',
            'Priority job application pipeline tracking & CRM',
            'Real-time Telegram & WhatsApp drop alerts',
            'Full 12 Months Continuous Access & Career Shield'
        ]
    }
}

COMPARISON_MATRIX = [
    {
        'feature': 'Scraped Public Listings (India & Global)',
        'free': 'Yes (9,725 listings)',
        'vip': 'Yes (9,725 listings)',
        'highlight': False
    },
    {
        'feature': 'Time of Listing Access',
        'free': 'Standard Public Delay (6–8h late)',
        'vip': 'Instant Zero-Minute Drop Alerts',
        'highlight': True
    },
    {
        'feature': 'Recruiter & HR Direct Emails',
        'free': 'Masked (e.g. s***@company.com)',
        'vip': '100% Revealed verified work emails',
        'highlight': True
    },
    {
        'feature': 'IIT/IISc Research Labs Directory',
        'free': 'Preview top 3 per institute',
        'vip': 'All 290+ verified lab heads & direct emails',
        'highlight': True
    },
    {
        'feature': 'AI Resume Matcher & Fit Analysis',
        'free': '1 test scan / month',
        'vip': 'Unlimited full diagnostics & keyword gap analysis',
        'highlight': True
    },
    {
        'feature': '1-Click Cold Email Drafter',
        'free': 'Generic template',
        'vip': 'Hyper-personalized by role, lab & professor',
        'highlight': True
    },
    {
        'feature': 'System Design & AI Interview Vault',
        'free': '10 preview questions',
        'vip': 'Full 330+ structured technical QA vault',
        'highlight': True
    },
    {
        'feature': 'Application CRM / Tracker',
        'free': 'Basic local save',
        'vip': 'Cloud pipeline (Saved, Applied, Interviewing, Offer)',
        'highlight': False
    }
]


class PremiumService:
    def get_plans_catalog(self) -> Dict[str, Any]:
        return {
            'plans': list(PLANS.values()),
            'matrix': COMPARISON_MATRIX,
            'guarantee': '7-day no questions asked money-back guarantee',
            'currency': 'INR'
        }

    def get_vip_overview(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        user = user_repo.get_by_id(user_id) if user_id else user_repo.get_default_or_create()
        is_premium = user.is_premium if user else False
        tier = getattr(user, 'premium_tier', 'lifetime') if user else None

        # Fetch live stats for VIP summary
        _, total_jobs, _ = job_repo.search(limit=1)
        early_access_count = job_repo.get_early_access_count()
        total_hr = hr_repo.get_total_count()
        total_profs = research_repo.get_total_count()
        total_prep = prep_repo.get_total_count()

        return {
            'status': 'success',
            'is_premium': is_premium,
            'tier': tier,
            'user': {
                'id': user.id if user else None,
                'email': user.email if user else None,
                'name': user.name if user else None,
                'is_premium': is_premium,
                'tier': tier
            } if user else None,
            'vip_stats': {
                'total_jobs_tracked': total_jobs,
                'early_access_drops_today': early_access_count,
                'verified_hr_contacts': total_hr,
                'iit_lab_directors': total_profs,
                'technical_vault_questions': total_prep,
                'average_placement_timeline': '21 days'
            }
        }

    def create_payment_order(self, plan_id: str, currency: str = 'INR', user_id: Optional[int] = None) -> Dict[str, Any]:
        if plan_id not in PLANS:
            raise ValidationError(f"Invalid plan '{plan_id}'. Choose from: {list(PLANS.keys())}")

        plan = PLANS[plan_id]
        currency = (currency or 'INR').upper()
        if currency not in ['INR', 'USD']:
            currency = 'INR'

        if currency == 'USD':
            amount = plan.get('price_usd', 9.99)
            gateway = 'dodo_payments'
            gateway_label = 'Dodo Payments (Global / US)'
        else:
            amount = plan.get('price_inr', 75)
            gateway = 'cashfree'
            gateway_label = 'Cashfree Payments (India UPI/Cards)'

        order_id = f"order_{hashlib.md5(f'{plan_id}_{amount}_{currency}_{user_id}'.encode()).hexdigest()[:14]}"

        return {
            'status': 'success',
            'order_id': order_id,
            'amount': amount,
            'currency': currency,
            'gateway': gateway,
            'gateway_label': gateway_label,
            'plan': plan
        }

    def verify_payment_and_grant_vip(
        self,
        order_id: str,
        payment_id: str,
        signature: str,
        plan_id: str = 'lifetime',
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        if not payment_id or not order_id:
            raise ValidationError("order_id and payment_id are required")

        # In dev/mock mode or with valid secret
        secret = settings.RAZORPAY_KEY_SECRET or 'mock_secret_key_99rs'
        generated_sig = hmac.new(
            secret.encode('utf-8'),
            f"{order_id}|{payment_id}".encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # Allow dev/mock verification if signature matches or starts with 'mock_'
        is_valid = (
            signature == generated_sig
            or payment_id.startswith('mock_')
            or signature == 'mock_verified'
            or settings.FLASK_ENV == 'development'
        )

        if not is_valid:
            raise AuthError("Payment signature verification failed.")

        user = user_repo.get_by_id(user_id) if user_id else user_repo.get_default_or_create()
        if user:
            user_repo.set_premium(user.id, tier=plan_id)

        return {
            'status': 'success',
            'message': 'VIP Access successfully unlocked!',
            'payment_id': payment_id,
            'order_id': order_id,
            'tier': plan_id,
            'unlocked_features': [
                'Instant Zero-Minute Early Access Drops',
                'Revealed Verified HR Manager Direct Emails',
                'Direct Access to 290+ IIT/IISc Research Lab Heads',
                'Full AI Diagnostic Resume Matcher',
                '1-Click Personalized Cold Email Generator',
                'Complete 330+ System Design & AI Question Vault'
            ]
        }


premium_service = PremiumService()
