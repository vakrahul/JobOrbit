import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Globe, 
  MapPin, 
  Banknote, 
  Lock, 
  CheckCircle2, 
  Check, 
  Bot, 
  Layers, 
  Mail, 
  Building2, 
  ExternalLink,
  ChevronRight,
  Search,
  Star,
  Cpu
} from 'lucide-react';

export default function LandingPage({ 
  stats, 
  onExploreJobs, 
  onOpenResume, 
  onOpenAudit,
  onOpenVIP, 
  onOpenLegal 
}) {
  const totalJobs = stats?.stats?.total_jobs || 13259;
  const indiaJobs = stats?.stats?.india_jobs || 4479;
  const globalJobs = stats?.stats?.global_jobs || 8780;
  const newToday = stats?.stats?.new_today || 1792;
  const totalHr = stats?.stats?.total_hr || 20;

  return (
    <div className="space-y-16 pb-20">
      
      {/* ── 1. HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-18 text-center space-y-6">
        
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-400/20 via-indigo-500/20 to-purple-400/20 blur-3xl pointer-events-none rounded-full -z-10"></div>

        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
          <span>AUTONOMOUS CAREER ENGINE • {totalJobs.toLocaleString()}+ VERIFIED TECH ROLES</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Land Verified Tech Jobs &amp; Internships <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            6–8 Hours Before Everyone Else
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          JobOrbit aggregates active engineering, AI/ML, cloud, and startup opportunities across India &amp; global remote markets. Tailored with Autonomous AI and 1-click recruiter outreach kits.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onExploreJobs}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Search className="w-4 h-4" />
            <span>Explore {totalJobs.toLocaleString()}+ Jobs</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onOpenAudit}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>AI Audit Agent</span>
          </button>

          <button
            onClick={onOpenResume}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>AI Resume Studio</span>
          </button>

          <button
            onClick={onOpenVIP}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Star className="w-4 h-4 fill-white" />
            <span>VIP Pass (₹75 / $9.99)</span>
          </button>
        </div>

        {/* Feature Checkpoints */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Direct Official ATS Portals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero Spam &bull; Direct ATS Links</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Early Access &bull; ₹75/mo VIP Pass</span>
          </div>
        </div>
      </section>


      {/* ── 2. LIVE TELEMETRY STATS GRID ──────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="text-center space-y-1 mb-6">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Live Telemetry Network
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Real-Time Ingestion Architecture
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Refreshed autonomously every 3 hours with delta crawlers and deduplication engines.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Positions</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {totalJobs.toLocaleString()}
            </div>
            <span className="text-xs text-slate-400">Verified Opportunities</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-xs font-semibold text-amber-800 uppercase">Added Today</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">
              +{newToday.toLocaleString()}
            </div>
            <span className="text-xs text-amber-700 font-medium">Early Access Window</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <span className="text-xs font-semibold text-blue-800 uppercase">India Tech</span>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">
              {indiaJobs.toLocaleString()}
            </div>
            <span className="text-xs text-blue-700 font-medium">Bangalore, Pune, Noida</span>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
            <span className="text-xs font-semibold text-purple-800 uppercase">Global Remote</span>
            <div className="text-2xl sm:text-3xl font-black text-purple-900 mt-1">
              {globalJobs.toLocaleString()}
            </div>
            <span className="text-xs text-purple-700 font-medium">US &bull; Europe &bull; Remote</span>
          </div>
        </div>
      </section>


      {/* ── 3. FOUR PLATFORMS IN ONE AGGREGATOR ───────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Multi-Source Aggregation
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Every Top Tech Channel in One Unified Terminal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
            Stop switching between dozens of fragmented career tabs. JobOrbit harmonizes the top sources into structured templates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Category 1: Direct ATS Portals */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Direct Official Portals</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verified zero-redirect official career portals (Workday, Greenhouse, Lever, Taleo) with automated compensation analysis.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
              <span>Direct ATS Links</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Category 2: Tech Internships */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-cyan-400 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verified Tech Internships</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Computer Science, Python, and Web Development internships with verified stipends and pre-written "Why should you be hired?" cover letters.
              </p>
            </div>
            <span className="text-xs font-semibold text-cyan-600 flex items-center gap-1">
              <span>"Why Hire Me" Templates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Category 3: Startups & Founders */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-400 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">High-Growth Startups</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                High-equity, high-growth startup positions. Complete with Founder outreach notes emphasizing agility, rapid prototyping, and ownership.
              </p>
            </div>
            <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">
              <span>Founder Pitch Letters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Category 4: Global Remote */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Global Remote Channels</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct hiring posts from engineering managers and founders. Includes instant 300-char connection request notes and InMail copy.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>Ready Connection Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

        </div>
      </section>


      {/* ── 4. AUTONOMOUS AI RESUME & FIT CHECK DEMO ─────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>POWERED BY AUTONOMOUS AI ENGINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              AI Skill Extraction &amp; Fit Check Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Upload or paste your resume. Our autonomous AI extracts your tech stack, computes Jaccard similarity indices against all 13,000+ jobs, and drafts personalized pitches without LaTeX clutter.
            </p>
          </div>

          <button
            onClick={onOpenResume}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-950 shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Launch Resume Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="font-bold text-sm text-blue-400 block">1. 60+ Tech Skill Detector</span>
            <p className="text-slate-400 leading-relaxed">
              Detects Python, PyTorch, React, Next.js, Docker, Kubernetes, AWS, SQL, and LLM agent architectures instantly.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="font-bold text-sm text-purple-400 block">2. Gap Diagnostic Roadmap</span>
            <p className="text-slate-400 leading-relaxed">
              Reveals exactly what skills you are missing for senior or high-CTC roles and recommends how to bridge the gap.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="font-bold text-sm text-emerald-400 block">3. One-Click Cold InMail Drafter</span>
            <p className="text-slate-400 leading-relaxed">
              Generates customized cold emails tailored to hiring managers with tone controls (Formal, Concise, Enthusiastic).
            </p>
          </div>
        </div>
      </section>


      {/* ── 5. TRANSPARENT PRICING & VIP PASS ───────────────────────── */}
      <section className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Simple, Transparent Access
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            VIP Early Access — ₹75 / Month
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Direct access to verified roles, recruiter inboxes, and autonomous AI tools. Zero surprise fees, cancel anytime.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white border-2 border-blue-500 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
            FULL ACCESS PASS
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">VIP Pro Membership</span>
              <h3 className="text-2xl font-black text-slate-900">JobOrbit VIP Pass</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl sm:text-5xl font-black text-blue-900">₹75</span>
                <span className="text-sm font-bold text-slate-600">/ month</span>
                <span className="text-xs text-slate-400 font-semibold ml-2">($9.99 Global)</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                Multi-month options: ₹215 (3 Months) &bull; ₹699 (1 Year) via Cashfree UPI | $24.99 via Dodo Payments
              </p>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-800 pt-4 border-t border-blue-200">
              <div className="flex items-center gap-2.5 font-semibold">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>New opportunities 6–8 hours early access window</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Verified HR recruiter inboxes &amp; direct emails</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Unlimited AI resume fit checks &amp; gap roadmaps</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Instant ready-to-send hiring manager outreach notes</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Direct official ATS links (Workday, Greenhouse, Lever, Taleo)</span>
              </div>
            </div>

            <button
              onClick={onOpenVIP}
              className="w-full py-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>Get VIP Early Access Pass (₹75 / mo)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>


      {/* ── 6. CAREER POLICY & SECURITY ASSURANCE ──────────────────────── */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-600">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-200 rounded-xl text-slate-700 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Enterprise Security &amp; Career Compilation Policy
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              JobOrbit strictly isolates credentials, API keys, and session cookies in server environment variables. All compilation data is proprietary. All rights reserved © 2026.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenLegal('terms')}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Privacy Shield
          </button>
          <button
            onClick={() => onOpenLegal('career')}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Career Policy
          </button>
        </div>
      </section>

    </div>
  );
}
