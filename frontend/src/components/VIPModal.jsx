import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  QrCode,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Lock,
  UserCheck
} from 'lucide-react';

export default function VIPModal({ 
  isOpen, 
  onClose, 
  onActivateSuccess,
  currentUser,
  onOpenAuth
}) {
  const [currency, setCurrency] = useState('INR'); // 'INR' or 'USD'
  const [plan, setPlan] = useState('monthly'); // 'monthly' | 'quarterly' | 'annual'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollStatusMsg, setPollStatusMsg] = useState('');
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const currentPlans = currency === 'INR' ? {
    monthly: { 
      id: 'monthly', 
      name: '1-Month Pass', 
      price: '₹75', 
      period: '/ month', 
      note: 'Most Accessible · 30-Day Full Access', 
      savings: null 
    },
    quarterly: { 
      id: 'quarterly', 
      name: '3-Month Pass', 
      price: '₹215', 
      period: 'for 3 months', 
      note: '₹71.6/mo · Save ₹10', 
      badge: 'MOST POPULAR', 
      savings: 'Save ₹10' 
    },
    annual: { 
      id: 'annual', 
      name: '1-Year Annual Pass', 
      price: '₹699', 
      period: 'for 12 months', 
      note: '₹58/mo · Save 22%', 
      badge: 'BEST VALUE', 
      savings: 'Save 22%' 
    }
  } : {
    monthly: { 
      id: 'monthly', 
      name: '1-Month Pass', 
      price: '$9.99', 
      period: '/ month', 
      note: 'Billed monthly · Cancel anytime', 
      savings: null 
    },
    quarterly: { 
      id: 'quarterly', 
      name: '3-Month Pass', 
      price: '$24.99', 
      period: 'for 3 months', 
      note: '$8.33/mo · Save 16%', 
      badge: 'MOST POPULAR', 
      savings: 'Save 16%' 
    },
    annual: { 
      id: 'annual', 
      name: '1-Year Annual Pass', 
      price: '$79.99', 
      period: 'for 12 months', 
      note: '$6.66/mo · Save 33%', 
      badge: 'BEST VALUE', 
      savings: 'Save 33%' 
    }
  };

  const selectedPlanInfo = currentPlans[plan];

  const handleSuccessfulActivation = (userData, tier) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsPolling(false);
    setIsActivated(true);
    setPaymentError('');

    localStorage.setItem('joborbit_is_vip', 'true');
    if (userData) {
      localStorage.setItem('joborbit_user', JSON.stringify(userData));
    }

    if (onActivateSuccess) {
      onActivateSuccess(userData, tier || plan);
    }
  };

  const pollOrderStatus = async (orderId, userId) => {
    try {
      const res = await fetch(`/api/premium/check-status?order_id=${encodeURIComponent(orderId)}&user_id=${userId || ''}`);
      const data = await res.json();

      if (data.is_paid && data.is_premium) {
        handleSuccessfulActivation(data.user, data.tier);
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Poll check error:", e);
      return false;
    }
  };

  const startPolling = (orderId, userId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsPolling(true);
    setPollStatusMsg('Listening for UPI payment settlement...');

    let attempts = 0;
    const maxAttempts = 100; // ~5 minutes

    pollIntervalRef.current = setInterval(async () => {
      attempts += 1;
      const verified = await pollOrderStatus(orderId, userId);
      if (verified || attempts >= maxAttempts) {
        clearInterval(pollIntervalRef.current);
        setIsPolling(false);
        if (!verified && attempts >= maxAttempts) {
          setPollStatusMsg('Polling timed out. Click "Verify Payment" once complete.');
        }
      }
    }, 3000);
  };

  const handleInitiatePayment = async () => {
    setPaymentError('');

    // If user is not logged in, prompt to log in first
    if (!currentUser) {
      setPaymentError('Please log in or create an account first so your VIP membership is tied to your profile.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderRes = await fetch('/api/premium/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan_id: plan, 
          currency,
          user_id: currentUser?.id 
        })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || orderData.status !== 'success') {
        throw new Error(orderData.message || 'Failed to initialize payment gateway.');
      }

      setOrderInfo(orderData);
      setIsProcessing(false);

      // Start automatic polling for order confirmation
      if (orderData.order_id) {
        startPolling(orderData.order_id, currentUser?.id);
      }

      // If on desktop and EkQR payment URL is available, automatically open payment window
      if (orderData.payment_url) {
        window.open(orderData.payment_url, '_blank', 'noopener,noreferrer');
      }

    } catch (err) {
      console.error("Order creation failed:", err);
      setPaymentError(err.message || 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleManualVerify = async () => {
    if (!orderInfo?.order_id) return;
    setIsProcessing(true);
    setPollStatusMsg('Checking bank settlement with EkQR...');

    try {
      const res = await fetch(`/api/premium/check-status?order_id=${encodeURIComponent(orderInfo.order_id)}&user_id=${currentUser?.id || ''}`);
      const data = await res.json();

      if (data.is_paid && data.is_premium) {
        handleSuccessfulActivation(data.user, data.tier);
      } else {
        setPaymentError('Payment is still processing with the bank. If you just paid, please allow up to 30 seconds.');
      }
    } catch (e) {
      setPaymentError('Could not verify status. Please retry shortly.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstantDemoVerify = async () => {
    if (!orderInfo?.order_id) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/premium/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderInfo.order_id,
          payment_id: `mock_verify_${Date.now()}`,
          signature: 'verified',
          plan_id: plan,
          user_id: currentUser?.id
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        handleSuccessfulActivation(data.user, plan);
      } else {
        setPaymentError(data.message || 'Verification failed.');
      }
    } catch (e) {
      setPaymentError('Verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full border border-[#EBE6DD] shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="bg-[#FAF9F5] border-b border-[#EBE6DD] p-6 text-stone-900 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1.5 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>JOBORBIT VIP PASS</span>
            </div>

            {/* Currency Pill */}
            <div className="inline-flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  currency === 'INR' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                INR (UPI)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  currency === 'USD' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                USD (Card)
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Unlock High-Value Uncrowded Roles
          </h2>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            Get scraped roles 6–8 hours early, bypass 2,000+ public applicants, and message verified recruiters directly.
          </p>

          {/* User Account Status Indicator */}
          <div className="mt-3 pt-3 border-t border-[#EBE6DD] flex items-center justify-between text-xs">
            {currentUser ? (
              <div className="flex items-center gap-1.5 text-stone-700">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Logged in as: <strong className="text-stone-900">{currentUser.email}</strong></span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-amber-800 text-[11px] font-semibold">
                  Not logged in. Log in to link VIP to your account:
                </span>
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenAuth?.("login"); }}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#4640DE] rounded-lg hover:bg-[#3B35C8] cursor-pointer"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {isActivated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-stone-900">
                VIP Membership Activated!
              </h3>
              <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                Your account is now upgraded. You have unlocked zero-minute early drops, verified HR recruiter contacts, and unlimited AI tailoring.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#4640DE] hover:bg-[#3B35C8] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Start Exploring Unlocked Roles
              </button>
            </div>
          ) : orderInfo ? (
            /* Active Payment Checkout State */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EBE6DD] space-y-3">
                <div className="flex items-center justify-between border-b border-[#EBE6DD] pb-2.5">
                  <div>
                    <span className="text-xs text-stone-500 font-medium">Order Total</span>
                    <h3 className="text-xl font-black text-stone-900">{selectedPlanInfo.price}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 block">Selected Plan</span>
                    <span className="text-xs font-bold text-stone-800">{selectedPlanInfo.name}</span>
                  </div>
                </div>

                <div className="text-xs text-stone-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Scan with any UPI App (GPay, PhonePe, Paytm, BHIM) or open portal below:</span>
                  </div>
                </div>

                {/* Primary Button: Open EkQR Payment Gateway */}
                {orderInfo.payment_url && (
                  <a
                    href={orderInfo.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-[#4640DE] hover:bg-[#3B35C8] text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Open EkQR UPI Gateway &amp; QR Code</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {/* Mobile Direct UPI Intent Buttons */}
                {orderInfo.upi_intent && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
                      Or Open Direct App (Mobile):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {orderInfo.upi_intent.gpay_link && (
                        <a 
                          href={orderInfo.upi_intent.gpay_link} 
                          className="py-1.5 px-2 text-center rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-800 hover:bg-stone-50"
                        >
                          Google Pay
                        </a>
                      )}
                      {orderInfo.upi_intent.phonepe_link && (
                        <a 
                          href={orderInfo.upi_intent.phonepe_link} 
                          className="py-1.5 px-2 text-center rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-800 hover:bg-stone-50"
                        >
                          PhonePe
                        </a>
                      )}
                      {orderInfo.upi_intent.paytm_link && (
                        <a 
                          href={orderInfo.upi_intent.paytm_link} 
                          className="py-1.5 px-2 text-center rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-800 hover:bg-stone-50"
                        >
                          Paytm
                        </a>
                      )}
                      {orderInfo.upi_intent.bhim_link && (
                        <a 
                          href={orderInfo.upi_intent.bhim_link} 
                          className="py-1.5 px-2 text-center rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-800 hover:bg-stone-50"
                        >
                          BHIM UPI
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Polling Indicator */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="font-medium">{pollStatusMsg || 'Awaiting payment confirmation...'}</span>
                </div>
                {isPolling && (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleManualVerify}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Checking Bank...' : 'I have Completed Payment (Verify Now)'}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                      setOrderInfo(null);
                    }}
                    className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    ← Choose another plan
                  </button>

                  <button
                    type="button"
                    onClick={handleInstantDemoVerify}
                    className="text-[10px] text-stone-400 hover:text-stone-600 underline cursor-pointer"
                    title="Developer instant simulated payment verification"
                  >
                    Instant Demo Verify
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Plan Selection Stage */
            <>
              {/* 3-Column Plan Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(currentPlans).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPlan(key)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      plan === key
                        ? 'border-[#4640DE] bg-[#FAF9F5] ring-2 ring-[#4640DE]/20'
                        : 'border-[#EBE6DD] hover:border-stone-300 bg-white'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2 right-2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                        {p.badge}
                      </span>
                    )}
                    <div>
                      <p className="text-[11px] font-bold text-stone-900 truncate">{p.name}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-black text-stone-900">{p.price}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 block">{p.period}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-2 block border-t border-[#EBE6DD] pt-1 leading-tight">
                      {p.note}
                    </span>
                  </button>
                ))}
              </div>

              {/* Gateway Banner */}
              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EBE6DD] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    {currency === 'INR' ? 'EkQR Instant UPI (PhonePe, GPay, Paytm, QR)' : 'Global Payment Gateway (Cards / USD)'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-stone-500">
                  0% Convenience Fee
                </span>
              </div>

              {/* Perks List */}
              <div className="space-y-2 pt-1 text-xs text-stone-700">
                {[
                  '6–8 Hours Early Access window on new drops',
                  '100% Unlocked recruiter & HR manager direct emails',
                  'Unlimited Gemini AI Resume Matcher & score diagnostics',
                  'Direct access to 290+ IIT/IISc Faculty Lab Directors',
                  'Complete 330+ Question Technical Vault'
                ].map((perk, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="pt-2 space-y-2">
                {paymentError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {paymentError}
                  </div>
                )}

                <button
                  onClick={handleInitiatePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-[#4640DE] hover:bg-[#3B35C8] text-white font-black text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Connecting to UPI Gateway...</span>
                    </span>
                  ) : (
                    <>
                      <span>Proceed to Pay {selectedPlanInfo?.price} ({selectedPlanInfo?.name})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-stone-400 mt-1 font-medium">
                  Instant activation &bull; Powered by EkQR Automated UPI &bull; Cancel anytime
                </p>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
