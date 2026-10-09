import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Scale, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

export default function TermsPolicyModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                JobOrbit Legal, Career Policy &amp; Security Terms
              </h3>
              <p className="text-xs text-slate-500">
                Official Regulatory, Privacy &amp; Data Rights Disclosures (All Rights Reserved © 2026)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-100 flex flex-wrap gap-2 bg-slate-50/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Privacy &amp; Data Shield
          </button>
          <button
            onClick={() => setActiveTab('career')}
            className={`px-3 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'career'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Career Compilation Policy
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Security &amp; Secret Isolation
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          
          {/* TAB 1: TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                <h4 className="font-bold text-xs uppercase tracking-wide">1. Agreement to Terms</h4>
                <p className="mt-1">
                  By accessing JobOrbit, you agree to comply with all applicable local and international regulations. JobOrbit provides discovery intelligence for verified employment listings.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">2. Non-Affiliation Disclaimer</h5>
                <p className="mt-1">
                  JobOrbit is an autonomous career aggregator. JobOrbit is not affiliated with, sponsored by, or endorsed by LinkedIn Corporation, Internshala, Wellfound (AngelList), or employer job boards indexed. All company trademarks and job postings remain the intellectual property of their respective owners.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">3. Candidate Conduct &amp; Ethical Outreach</h5>
                <p className="mt-1">
                  Users agree to use outreach kits and recruiter templates ethically. Unsolicited spam, automated bulk messaging, or deceptive representation to employers is strictly prohibited.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">4. 5-Day Trial &amp; Transparent Checkout Guarantee</h5>
                <p className="mt-1">
                  JobOrbit offers a clear 5-day trial period. Premium passes (starting at ₹75 for India via Cashfree / $9.99 for International via Dodo Payments) are transparent payments processed through PCI-DSS certified gateways. We never store your raw card numbers and never enroll users into hidden auto-renewals.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                <h4 className="font-bold text-xs uppercase tracking-wide">Zero Data Selling Guarantee</h4>
                <p className="mt-1">
                  JobOrbit does NOT sell, monetize, or broker candidate resumes, personal emails, or search queries to third-party advertisers.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">1. Resume &amp; Profile Processing</h5>
                <p className="mt-1">
                  Resume text submitted for AI matching is evaluated ephemerally in-memory for skill extraction and fit check diagnostics. We do not expose your resume text to other users or public feeds.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">2. Cookie Policy</h5>
                <p className="mt-1">
                  We use strictly necessary functional session storage for application tracking and search preferences. We do not inject invasive cross-site tracking cookies.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">3. Data Deletion Rights (GDPR &amp; DPDP Compliant)</h5>
                <p className="mt-1">
                  Users have the right to purge all saved applications, tracked pipeline stages, and cached resume analyses at any time with one click.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CAREER POLICY (ALL RIGHTS RESERVED) */}
          {activeTab === 'career' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
                <h4 className="font-bold text-xs uppercase tracking-wide">All Rights Reserved © 2026 JobOrbit Platform</h4>
                <p className="mt-1">
                  The JobOrbit architecture, automated deduplication pipelines, natural salary inference algorithms, and outreach templates are proprietary intellectual property.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">1. Aggregation Rights &amp; Safe Harbor</h5>
                <p className="mt-1">
                  JobOrbit crawls and indexes publicly accessible career postings under standard web indexing protocols. We provide direct attribution and deep-links to original employer career portals (Workday, Greenhouse, Lever, etc.).
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">2. Anti-Scraping Shield on Proprietary Compilations</h5>
                <p className="mt-1">
                  Automated scraping, bulk harvesting, or commercial replication of JobOrbit's curated database records is strictly prohibited without explicit written licensing.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">3. Employer Takedown / Listing Inquiries</h5>
                <p className="mt-1">
                  Employers requesting verification updates, email corrections, or listing removal can email us directly at <span className="font-mono font-bold text-blue-600">legal@joborbit.app</span> for expedited 24-hour review.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & ISOLATION */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900 text-white rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                  <Lock className="w-4 h-4" />
                  <span>Strict Zero-Exposure Security System</span>
                </div>
                <p className="mt-1.5 text-slate-300">
                  All sensitive credentials (AI engine API keys, data ingestion session tokens, payment webhooks, and Admin JWT secrets) are permanently isolated inside server-side environment variables.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">1. No Client-Side Secret Leakage</h5>
                <p className="mt-1">
                  The frontend client bundle never contains private API keys or scraping cookies. All intelligent operations (AI resume fit checks, LinkedIn batch runs, cold email generations) execute via protected backend proxy routes.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">2. Admin &amp; VIP Route Guards</h5>
                <p className="mt-1">
                  Admin ingestion telemetry, database CRUD functions, and scraper controls are guarded by cryptographically signed headers (<span className="font-mono font-semibold">X-Admin-Token</span>) and rate-limited burst shields.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-sm">3. Autonomous AI Engine Isolation</h5>
                <p className="mt-1">
                  Our autonomous intelligence engine operates via server-to-server TLS 1.3 encryption. Raw prompts and generated emails are sanitized to remove LaTeX artifacts, math delimiters, and raw codeblocks before presenting clean text to candidates.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <span className="text-[11px] text-slate-400">
            Last Updated: October 2026 • JobOrbit Compliance Team
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Acknowledge &amp; Close
          </button>
        </div>

      </div>
    </div>
  );
}
