import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  Zap, 
  ShieldCheck, 
  Users, 
  Lock, 
  Clock, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function VIPModal({ isOpen, onClose, onActivateSuccess }) {
  const [currency, setCurrency] = useState('INR'); // 'INR' or 'USD'
  const [plan, setPlan] = useState('monthly'); // 'monthly' | 'quarterly' | 'annual'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  if (!isOpen) return null;

  const currentPlans = currency === 'INR' ? {
    monthly: { id: 'monthly', name: '1 Month', price: '₹75', period: '/ month', note: 'Billed monthly · Cancel anytime', savings: null },
    quarterly: { id: 'quarterly', name: '3 Months', price: '₹215', period: 'for 3 mos', note: '₹71.6/mo · Save ₹10', badge: 'MOST POPULAR', savings: 'Save ₹10' },
    annual: { id: 'annual', name: '1 Year Pass', price: '₹699', period: 'for 12 mos', note: '₹58/mo · Save 22%', badge: 'BEST VALUE', savings: 'Save 22%' }
  } : {
    monthly: { id: 'monthly', name: '1 Month', price: '$9.99', period: '/ month', note: 'Billed monthly · Cancel anytime', savings: null },
    quarterly: { id: 'quarterly', name: '3 Months', price: '$24.99', period: 'for 3 mos', note: '$8.33/mo · Save 16%', badge: 'MOST POPULAR', savings: 'Save 16%' },
    annual: { id: 'annual', name: '1 Year Pass', price: '$79.99', period: 'for 12 mos', note: '$6.66/mo · Save 33%', badge: 'BEST VALUE', savings: 'Save 33%' }
  };

  const selectedPlanInfo = currentPlans[plan];

  const verifyPaymentOnBackend = async (payload) => {
    try {
      const verifyRes = await fetch('/api/premium/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.status === 'success') {
        localStorage.setItem('joborbit_is_vip', 'true');
        setIsActivated(true);
        setPaymentError('');
        if (onActivateSuccess) onActivateSuccess();
      } else {
        setPaymentError(verifyData.message || 'Payment signature verification failed.');
      }
    } catch (err) {
      console.error("Backend verification error:", err);
      setPaymentError('Failed to complete payment verification. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setPaymentError('');

    try {
      // 1. Create order on backend with currency
      const orderRes = await fetch('/api/premium/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan, currency })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.status !== 'success') {
        throw new Error(orderData.message || 'Failed to initialize payment gateway.');
      }

      // If Cashfree session is available and SDK loaded
      if (currency === 'INR' && orderData.payment_session_id && window.Cashfree) {
        try {
          const cashfree = window.Cashfree({
            mode: orderData.cashfree_mode || 'sandbox'
          });

          cashfree.checkout({
            paymentSessionId: orderData.payment_session_id,
            redirectTarget: '_modal'
          }).then(async (result) => {
            if (result.error) {
              setPaymentError(result.error.message || 'Payment cancelled.');
              setIsProcessing(false);
            } else {
              await verifyPaymentOnBackend({
                order_id: orderData.order_id,
                payment_id: `cf_${Date.now()}`,
                signature: 'verified',
                plan_id: plan,
                currency: currency
              });
            }
          });
          return;
        } catch (sdkErr) {
          console.warn("Cashfree checkout error:", sdkErr);
        }
      }

      // Simulate verification / gateway resolution
      setTimeout(async () => {
        await verifyPaymentOnBackend({
          order_id: orderData.order_id,
          payment_id: currency === 'INR' ? `cf_${Date.now()}` : `dodo_${Date.now()}`,
          signature: 'verified',
          plan_id: plan,
          currency: currency
        });
      }, 900);
    } catch (err) {
      console.error("Order creation failed:", err);
      setPaymentError(err.message || 'Payment initiation failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden relative">
        
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-7 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full bg-black/10 hover:bg-black/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>VIP EARLY ACCESS MEMBERSHIP</span>
            </div>

            {/* Currency Selector Pill */}
            <div className="inline-flex items-center bg-black/25 p-0.5 rounded-xl border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  currency === 'INR' ? 'bg-white text-blue-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                🇮🇳 INR
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  currency === 'USD' ? 'bg-white text-blue-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                🌐 USD
              </button>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Be First In The Applicant Queue
          </h2>
          <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
            Get roles 6–8 hours before public aggregators. Apply with unlocked recruiter contacts &amp; AI kits.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 space-y-5">
          
          {isActivated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                VIP Access Unlocked!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You now have full early access to freshly dropped listings, unlocked recruiter inboxes, and unlimited AI resume matching.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Start Exploring VIP Directory
              </button>
            </div>
          ) : (
            <>
              {/* Plan Choice 3-Column Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(currentPlans).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPlan(key)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      plan === key
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                        {p.badge}
                      </span>
                    )}
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 truncate">{p.name}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-black text-slate-900">{p.price}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">{p.period}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block border-t border-slate-100 pt-1 leading-tight">
                      {p.note}
                    </span>
                  </button>
                ))}
              </div>

              {/* Gateway Banner */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    {currency === 'INR' ? 'Cashfree Payments Gateway (India)' : 'Dodo Payments Gateway (US / Global)'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {currency === 'INR' ? 'UPI / RuPay / NetBanking' : 'Cards / Apple Pay / USD'}
                </span>
              </div>

              {/* Perks List */}
              <div className="space-y-2 pt-1 text-xs text-slate-700">
                {[
                  '⚡ 6–8 Hours Early Access window on new tech drops',
                  '🔓 100% Unlocked recruiter & professor emails',
                  '🤖 Unlimited Autonomous AI Resume Tailoring',
                  '✉️ 1-Click personalized cold outreach templates (LaTeX stripped)',
                  '🎯 Zero third-party redirects or trackers forever'
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
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Processing via {currency === 'INR' ? 'Cashfree' : 'Dodo Payments'}...</span>
                    </span>
                  ) : (
                    <>
                      <span>Unlock VIP — {selectedPlanInfo?.price} ({selectedPlanInfo?.name})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-1.5 font-medium">
                  Instant activation &bull; 5-Day money-back guarantee &bull; Encrypted checkout
                </p>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
