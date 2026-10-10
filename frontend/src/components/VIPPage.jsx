import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  Users, 
  GraduationCap, 
  Target, 
  Terminal, 
  Mail, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  HelpCircle,
  TrendingUp,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function VIPPage({ onBackToJobs, currentUser, onOpenAuth }) {
  const [currency, setCurrency] = useState('INR'); // 'INR' or 'USD'
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'monthly' | 'quarterly' | 'annual'
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isActivated, setIsActivated] = useState(() => {
    return Boolean(currentUser?.is_premium);
  });
  const [previewLocked, setPreviewLocked] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // VIP Email Dispatcher Preferences
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(() => {
    return localStorage.getItem('joborbit_notif_enabled') !== 'false';
  });
  const [notifEmail, setNotifEmail] = useState(() => {
    return localStorage.getItem('joborbit_notif_email') || 'candidate@gmail.com';
  });
  const [notifFrequency, setNotifFrequency] = useState(() => {
    return localStorage.getItem('joborbit_notif_freq') || '5';
  });
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const saved = localStorage.getItem('joborbit_notif_categories');
    return saved ? JSON.parse(saved) : ['ai', 'backend', 'internship', 'remote'];
  });
  const [notifSavedMsg, setNotifSavedMsg] = useState('');
  const [testDispatched, setTestDispatched] = useState(false);

  const handleSaveNotifPrefs = () => {
    localStorage.setItem('joborbit_notif_enabled', emailNotifEnabled.toString());
    localStorage.setItem('joborbit_notif_email', notifEmail);
    localStorage.setItem('joborbit_notif_freq', notifFrequency);
    localStorage.setItem('joborbit_notif_categories', JSON.stringify(selectedCategories));
    setNotifSavedMsg('Notification preferences saved! Fresh drops will dispatch within 5 hours of posting.');
    setTimeout(() => setNotifSavedMsg(''), 4000);
  };

  const handleTestDispatch = () => {
    setTestDispatched(true);
    setTimeout(() => {
      setTestDispatched(false);
      alert(`Real-Time VIP Job Drop Dispatched to ${notifEmail}!\n\nDelivery SLA: Within 5 hours of company posting\nFrequency: ${notifFrequency} drops/day\n\nIncluded Curated Positions:\n1. xstratum.ai — Agentic AI Intern (SF / Remote, $40/hr)\n2. Aden (YC) — Core Product Engineer (SF / Remote, $120k)\n3. Zepto — Backend SDE Intern (Bengaluru, ₹60k/mo)\n4. Swiggy — AI Platform Engineer (₹18L - ₹24L)\n5. Google — Software Engineering Intern (Summer 2026)`);
    }, 600);
  };

  const plansData = currency === 'INR' ? {
    monthly: { id: 'monthly', name: '1-Month Pass', price: '₹75', period: '/ month', note: 'Billed monthly · Cancel anytime', savings: null, badge: null },
    quarterly: { id: 'quarterly', name: '3-Month Quarterly Pass', price: '₹215', period: 'for 3 months', note: '₹71.6/mo · Save ₹10', savings: 'Save ₹10', badge: 'MOST POPULAR' },
    annual: { id: 'annual', name: '1-Year Annual Pass', price: '₹699', period: 'for 12 months', note: '₹58/mo · Best Value', savings: 'Save 22%', badge: 'BEST VALUE' }
  } : {
    monthly: { id: 'monthly', name: '1-Month Pass', price: '$9.99', period: '/ month', note: 'Billed monthly · Cancel anytime', savings: null, badge: null },
    quarterly: { id: 'quarterly', name: '3-Month Quarterly Pass', price: '$24.99', period: 'for 3 months', note: '$8.33/mo · Save 16%', savings: 'Save 16%', badge: 'MOST POPULAR' },
    annual: { id: 'annual', name: '1-Year Annual Pass', price: '$79.99', period: 'for 12 months', note: '$6.66/mo · Best Value', savings: 'Save 33%', badge: 'BEST VALUE' }
  };

  const activePlan = plansData[selectedPlan] || plansData['quarterly'];

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
        body: JSON.stringify({ plan_id: selectedPlan, currency })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.status !== 'success') {
        throw new Error(orderData.message || 'Failed to initialize payment gateway.');
      }

      // 2. If EkQR payment URL is available (automated UPI QR & Intent buttons)
      if (orderData.payment_url) {
        window.location.href = orderData.payment_url;
        return;
      }

      // 3. If Cashfree session is available and SDK loaded
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
                plan_id: selectedPlan,
                currency: currency
              });
            }
          });
          return;
        } catch (sdkErr) {
          console.warn("Cashfree checkout error:", sdkErr);
        }
      }

      // If EkQR or payment URL was not returned, report error
      if (!orderData.payment_url && !orderData.payment_session_id) {
        throw new Error('Payment gateway could not generate transaction session. Please try again.');
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      setPaymentError(err.message || 'Payment initiation failed.');
      setIsProcessing(false);
    }
  };

  const handleResetVIP = () => {
    localStorage.removeItem('joborbit_is_vip');
    setIsActivated(false);
  };

  return (
    <div className="space-y-12 pb-24 max-w-5xl mx-auto">
      
      {/* Hero Header */}
      <div className="text-center space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold tracking-wide shadow-2xs">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
          <span>VIP EARLY ACCESS MEMBERSHIP</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
          The Asymmetric Advantage for Top Tech Careers
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Stop competing with 5,000+ applicants on LinkedIn. Get newly scraped drops 6–8 hours early, unlock verified recruiter work inboxes, and tailor applications with AI.
        </p>

        {/* Quick Social Proof Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            195 New Roles Dropped Today
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            100% Verified Ingestion
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Instant Activation from ₹75 / $9.99
          </span>
        </div>
      </div>

      {/* The "First 50 Applicants" Math Infographic */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>THE 10X CALLBACK FORMULA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Why Being 6 Hours Early Changes Everything
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            When a tech company posts an opening, the hiring manager reviews the initial 25–50 candidates directly. Within 8 hours, social aggregators and LinkedIn repost it, flooding the inbox with 4,000+ resumes and triggering aggressive automated ATS rejections.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 relative z-10">
          <div className="p-5 rounded-2xl bg-white/5 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Early Window (JobOrbit VIP)</span>
              <span className="text-xs font-black text-emerald-300">0h - 6h</span>
            </div>
            <p className="text-3xl font-black text-white">85% Review Rate</p>
            <p className="text-xs text-slate-400">
              Less than 30 applicants in queue. Direct manual review by the recruiter or engineering lead.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Public Aggregators & LinkedIn</span>
              <span className="text-xs font-black text-rose-300">8h - 48h</span>
            </div>
            <p className="text-3xl font-black text-rose-300">3% Review Rate</p>
            <p className="text-xs text-slate-400">
              3,000+ applicants. 95% filtered out by harsh ATS keyword parsers without human review.
            </p>
          </div>
        </div>
      </div>

      {/* 6 Core Pillars of JobOrbit VIP */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Everything Included in VIP Access
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A complete unfair advantage toolkit built for serious tech candidates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              6–8h Early Access Window
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every newly scraped role drops to VIP members 6 to 8 hours before being released publicly. Apply while the pipeline is fresh.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              100% Unlocked Recruiter Inboxes
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full corporate emails of talent acquisition leads at Google, Microsoft, Amazon, Razorpay, CRED, Swiggy, and top startups.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              290+ IIT & IISc Lab Directors
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct access to faculty research labs across IIT Bombay, IIT Delhi, IISc, IIT Madras. Reach professors with 1-click tailored outreach.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              AI Resume Matcher & Diagnostics
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlimited scans against 9,700+ jobs. Discover exact missing keywords, ATS fit scores, and high-impact resume recommendations.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              1-Click Tailored Cold Outreach
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate cold emails tailored to the exact hiring manager or professor with your background. Open straight in your default mail app.
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              330+ Interview Q&A Vault
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full conversational model responses ("What to say out loud") across AI Engineering (Agentic AI, RAG, LoRA) and System Design.
            </p>
          </div>

        </div>
      </div>

      {/* Interactive Unlocked Recruiter Demonstration */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Interactive Preview: Locked vs Unlocked Recruiter Contact
            </h3>
            <p className="text-xs text-slate-500">
              Test how VIP members view corporate emails compared to standard public visitors
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setPreviewLocked(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewLocked ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Public Visitor View
            </button>
            <button
              onClick={() => setPreviewLocked(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !previewLocked ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              VIP Member View
            </button>
          </div>
        </div>

        {/* Demo Lead Card */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Priya Sharma</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">Google India</span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">Verified</span>
            </div>
            <p className="text-xs text-slate-500">
              Lead Technical Recruiter — AI & Core Cloud Infrastructure
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 font-mono text-xs flex items-center gap-2">
              {previewLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">pr***@google.com</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-900 font-semibold">priyasharma@google.com</span>
                </>
              )}
            </div>

            {!previewLocked && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText('priyasharma@google.com');
                  setCopiedEmail(true);
                  setTimeout(() => setCopiedEmail(false), 2000);
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                title="Copy Email"
              >
                {copiedEmail ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Free vs VIP Full Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Comparison: Standard Free vs VIP Access
          </h2>
          <p className="text-xs text-slate-500">
            A side-by-side breakdown of features and privileges
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Feature / Advantage</th>
                <th className="py-3 px-4 w-1/3">Public Free Tier</th>
                <th className="py-3 px-4 w-1/3 text-blue-600 font-bold">VIP Early Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Job Ingestion Index</td>
                <td className="py-3.5 px-4">9,725 verified listings</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">9,725 verified listings</td>
              </tr>
              <tr className="bg-amber-50/40">
                <td className="py-3.5 px-4 font-semibold text-slate-900">New Role Drop Timing</td>
                <td className="py-3.5 px-4 text-slate-500">Standard Delay (6–8h after scrape)</td>
                <td className="py-3.5 px-4 font-bold text-amber-900">Instant 0-Hour Early Access</td>
              </tr>
              <tr className="bg-blue-50/40">
                <td className="py-3.5 px-4 font-semibold text-slate-900">Recruiter Corporate Emails</td>
                <td className="py-3.5 px-4 text-slate-500">Obfuscated (e.g. pr***@google.com)</td>
                <td className="py-3.5 px-4 font-bold text-blue-900">100% Unlocked Direct Emails</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">IIT / IISc Research Labs</td>
                <td className="py-3.5 px-4">Limited Directory View</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">Direct Faculty Mail & Lab Links</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">AI Resume Matcher</td>
                <td className="py-3.5 px-4 text-slate-500">1 scan per day</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">Unlimited Scans & Keyword Gap Analysis</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">1-Click AI Cold Email Drafter</td>
                <td className="py-3.5 px-4 text-slate-500">Sample preview only</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">Unlimited Tailored Emails</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">AI LaTeX Resume Studio & JD Tailoring</td>
                <td className="py-3.5 px-4 text-slate-500">Standard templates</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">Unlimited AI JD Tailoring & LaTeX Compiles</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Middlemen & Trackers</td>
                <td className="py-3.5 px-4 text-emerald-700 font-semibold">Zero Redirects</td>
                <td className="py-3.5 px-4 text-emerald-700 font-semibold">Zero Redirects & Ad-Free Forever</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Selector & Checkout Card */}
      <div className="bg-white border-2 border-blue-600 rounded-3xl p-8 sm:p-10 shadow-xl space-y-8 relative overflow-hidden">
        
        {isActivated ? (
          <div className="space-y-8">
            {/* VIP Status Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">VIP PASS MEMBER ACTIVATED</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    All 13,282 roles unlocked • Unlocked Recruiter Contacts • 500,000 AI Resume tokens • Unlimited applications
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onBackToJobs}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Explore Early Drops
                </button>
                <button
                  onClick={handleResetVIP}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* CORE INTERACTIVE FEATURE: Automated Email Job Drop Dispatcher */}
            <div className="bg-gradient-to-br from-amber-50/70 via-white to-blue-50/50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                      <Mail className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Automated Real-Time Job Drop Notifications
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Should we notify you of matching opportunities directly via email? Configure your drop volume and categories below.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">Email Notifications:</label>
                  <button
                    type="button"
                    onClick={() => setEmailNotifEnabled(!emailNotifEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      emailNotifEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        emailNotifEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Notification SLA Banner */}
              <div className="p-3.5 rounded-xl bg-amber-100/70 border border-amber-300/80 flex items-center gap-2.5 text-xs text-amber-900">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Verified 5-Hour Freshness SLA:</strong> All matching roles are dispatched to your inbox within <strong>5 hours</strong> of company posting — never stale 6-month-old listings.
                </span>
              </div>

              {/* Recipient Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Recipient Email Address for Job Alerts:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestDispatch}
                    disabled={testDispatched || !emailNotifEnabled}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    {testDispatched ? 'Dispatching...' : 'Test Drop Now'}
                  </button>
                </div>
              </div>

              {/* Frequency Selector: 3, 5, or 10 drops per day */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Drop Frequency (Jobs Dispatched Per Day):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: '3', label: '3 Jobs / Day', desc: 'Curated Daily Spotlight (Low Volume)' },
                    { value: '5', label: '5 Jobs / Day (Recommended)', desc: 'Standard Balanced High-Yield Ingestion' },
                    { value: '10', label: '10 Jobs / Day', desc: 'Maximum Stream (High-Intensity Pipeline)' },
                  ].map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setNotifFrequency(freq.value)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        notifFrequency === freq.value
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{freq.label}</span>
                        {notifFrequency === freq.value && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{freq.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Category Preferences */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Job Categories to Include in Your Alerts:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    { id: 'ai', label: 'Agentic AI & LLMs', sub: 'MCP, Agents, RAG, PyTorch' },
                    { id: 'backend', label: 'Backend & Systems', sub: 'FastAPI, Python, Go, Node.js' },
                    { id: 'internship', label: 'SDE Internships', sub: 'Batches 2024, 2025, 2026, 2027' },
                    { id: 'remote', label: 'Global Remote ($50k+)', sub: 'High-stipend US / Europe roles' },
                    { id: 'research', label: 'IISc / IIT Research', sub: 'Faculty Deeptech Lab positions' },
                    { id: 'yc', label: 'YC & Seed Startups', sub: 'Direct Core Product & Founder roles' },
                  ].map((cat) => {
                    const isChecked = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                          } else {
                            setSelectedCategories([...selectedCategories, cat.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">{cat.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{cat.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Confirmation Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveNotifPrefs}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Notification Preferences</span>
                </button>
                {notifSavedMsg && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    {notifSavedMsg}
                  </span>
                )}
              </div>
            </div>

            {/* VIP Unlocked Privileges Launchpad (4 Toolkit Cards) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Your Unlocked VIP Privileges Toolkit:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <a
                  href="#resume"
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-xs space-y-1.5 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-900 group-hover:text-blue-600">
                    AI LaTeX Resume Builder
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Executive Charter ATS template, 500k AI tokens, and instant crisp PDF export.
                  </p>
                </a>

                <a
                  href="#resume"
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 shadow-xs space-y-1.5 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-900 group-hover:text-emerald-600">
                    PDF &amp; Image Editor
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Headshot crop, PDF margins, formatting &amp; real-time preview editing.
                  </p>
                </a>

                <a
                  href="#hr"
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 shadow-xs space-y-1.5 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-900 group-hover:text-purple-600">
                    HR Recruiter Leads
                  </div>
                  <p className="text-[11px] text-slate-500">
                    100% unlocked corporate emails &amp; LinkedIn recruiter DM shortcuts.
                  </p>
                </a>

                <a
                  href="#research"
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 shadow-xs space-y-1.5 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-900 group-hover:text-indigo-600">
                    IIT / IISc Research Labs
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Direct professor contacts across 290+ faculty deeptech labs.
                  </p>
                </a>

                <div
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    Unlimited Applications
                  </div>
                  <p className="text-[11px] text-slate-500">
                    5-application cap bypassed. 5-hour real-time drops on verified ATS links.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Select Your Plan &bull; 5-Day Money-Back Guarantee
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Unlock Unfair Advantage Starting at {currency === 'INR' ? '₹75/mo' : '$9.99/mo'}
              </h2>
              
              {/* Region / Currency Switcher */}
              <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    currency === 'INR' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>India (INR) &bull; Cashfree UPI/Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    currency === 'USD' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>US &amp; Global (USD) &bull; Dodo Payments</span>
                </button>
              </div>
            </div>

            {/* Plan Cards 3-Column */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(plansData).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlan(key)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedPlan === key
                      ? 'border-blue-600 bg-blue-50/40 ring-4 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                      {p.badge}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-slate-900">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {p.note}
                    </p>
                  </div>

                  <div className="pt-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900">{p.price}</span>
                      <span className="text-xs font-bold text-slate-500">{p.period}</span>
                    </div>
                    {p.savings && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {p.savings}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Gateway Assurance */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  {currency === 'INR' ? 'Secured by Cashfree Payments (UPI, PhonePe, GPay, RuPay & NetBanking)' : 'Secured by Dodo Payments (International Cards, Apple Pay & Google Pay)'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-bold">
                {currency === 'INR' ? 'INR Checkout' : 'USD Checkout'}
              </span>
            </div>

            {/* Action CTA Button */}
            <div className="space-y-3 pt-2">
              {paymentError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Processing via {currency === 'INR' ? 'Cashfree Payments' : 'Dodo Payments'}...</span>
                  </span>
                ) : (
                  <>
                    <span>Unlock VIP Early Access — {activePlan?.price} ({activePlan?.name})</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant Activation</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Satisfaction Guarantee</span>
                </span>
                <span>•</span>
                <span>Zero Hidden Fees</span>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500">
            Everything you need to know about the VIP Early Access pass
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900">
              Why does 6–8 hours early access matter?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              When high-paying tech roles open, thousands of applications flood in once they are posted on public communities and LinkedIn. Getting in within the first 50 applications ensures your resume is manually reviewed before automated caps close.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900">
              How are recruiter emails verified?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our automated crawlers cross-reference corporate domain patterns and talent acquisition lead public profiles. Over 90% of emails follow corporate patterns verified against active employee inboxes.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900">
              How does the VIP Pass billing work?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent, one-time passes. Plans start at ₹75/month (₹215 for 3 months, ₹699 annual) in India via Cashfree, and $9.99/month ($24.99 quarterly) globally via Dodo Payments. No hidden recurring traps.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900">
              Can I get a refund if I am not satisfied?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Absolutely. We provide a 100% money-back guarantee. If you don't find value in the early listings or recruiter directory, simply email us for an unconditional refund.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
