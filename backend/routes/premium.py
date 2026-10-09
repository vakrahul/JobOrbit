"""
routes/premium.py
-----------------
Thin controller layer for VIP & Monetization features.
Delegates all business logic and payment handling to services/premium_service.py.
"""
from flask import Blueprint, jsonify, request
from core.extensions import limiter, cache
from core.config import settings
from core.exceptions import AppError
from services.premium_service import premium_service

premium_bp = Blueprint('premium', __name__, url_prefix='/api/premium')


@premium_bp.route('/plans', methods=['GET'])
@limiter.limit("60 per minute")
@cache.cached(timeout=3600, key_prefix='premium_plans_catalog')
def get_plans():
    """
    GET /api/premium/plans
    Returns available VIP subscription plans and comparison matrix.
    Cached 1 hour.
    """
    return jsonify(premium_service.get_plans_catalog())


@premium_bp.route('/status', methods=['GET'])
@limiter.limit("60 per minute")
def get_status():
    """
    GET /api/premium/status
    Returns current user VIP status, tier, and live value metrics.
    """
    user_id = request.args.get('user_id', type=int)
    return jsonify(premium_service.get_vip_overview(user_id=user_id))


@premium_bp.route('/create-order', methods=['POST'])
@limiter.limit("30 per minute")
def create_order():
    """
    POST /api/premium/create-order
    Body: { plan_id: 'lifetime' | 'monthly', user_id? }
    """
    data = request.get_json(silent=True) or {}
    plan_id = data.get('plan_id', 'quarterly')
    currency = data.get('currency', 'INR')
    user_id = data.get('user_id')

    try:
        order = premium_service.create_payment_order(plan_id, currency=currency, user_id=user_id)
        return jsonify(order)
    except AppError as e:
        return jsonify(e.to_dict()), e.status_code


@premium_bp.route('/verify-payment', methods=['POST'])
@limiter.limit("30 per minute")
def verify_payment():
    """
    POST /api/premium/verify-payment
    Body: { order_id, payment_id, signature, plan_id?, user_id? }
    """
    data = request.get_json(silent=True) or {}
    try:
        result = premium_service.verify_payment_and_grant_vip(
            order_id=data.get('order_id', ''),
            payment_id=data.get('payment_id', ''),
            signature=data.get('signature', ''),
            plan_id=data.get('plan_id', 'lifetime'),
            user_id=data.get('user_id')
        )
        return jsonify(result)
    except AppError as e:
        return jsonify(e.to_dict()), e.status_code


@premium_bp.route('/webhook', methods=['POST'])
def cashfree_webhook():
    """
    POST /api/premium/webhook
    Receives instant webhook callbacks from Cashfree upon payment completion.
    """
    data = request.get_json(silent=True) or {}
    order_data = data.get('data', {}).get('order', {})
    order_id = order_data.get('order_id') or data.get('orderId')
    order_status = order_data.get('order_status') or data.get('txStatus')

    if order_status in ('PAID', 'SUCCESS') and order_id:
        try:
            premium_service.verify_payment_and_grant_vip(
                order_id=order_id,
                payment_id=f"wh_{order_id}",
                signature="verified",
                plan_id="monthly"
            )
        except Exception:
            pass

    return jsonify({"status": "received"}), 200

