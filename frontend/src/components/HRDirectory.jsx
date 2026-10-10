import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  ExternalLink, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles, 
  Building2, 
  Globe, 
  Send, 
  X,
  Lock,
  Unlock
} from 'lucide-react';

export default function HRDirectory({ onOpenVIP }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const isVIP = localStorage.getItem('joborbit_is_vip') === 'true';
  
  // AI Outreach Drafter Modal
  const [activeModalContact, setActiveModalContact] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateBg, setCandidateBg] = useState('Full Stack / Backend Engineer with React & Python experience');
  const [draftResult, setDraftResult] = useState(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      
      const headers = {};
      if (isVIP) {
        headers['X-Premium-User'] = 'true';
      }
      const token = localStorage.getItem('joborbit_user_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/hr?${params.toString()}`, { headers });
      const data = await res.json();
      if (data.status === 'success') {
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.error("Failed to fetch HR contacts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const copyEmail = (e, id, email) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDraftModal = (contact) => {
    setActiveModalContact(contact);
    setDraftResult(null);
    setDraftCopied(false);
  };

  const handleGenerateDraft = async () => {
    if (!activeModalContact) return;
    setIsDrafting(true);
    try {
      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'hr',
          target_id: activeModalContact.id,
          candidate_name: candidateName || 'Candidate',
          candidate_background: candidateBg
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDraftResult(data);
      }
    } catch (e) {
      console.error("Failed to draft outreach:", e);
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Tech Talent Acquisition Directory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Verified Tech Recruiters & Talent Partners
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            Direct access to verified engineering recruiters and TA leads at Google, Microsoft, Amazon, Razorpay, CRED, Uber, Swiggy, and top startups. Bypass resume filters with direct outreach.
          </p>

          {/* Search bar */}
          <div className="pt-2 relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recruiter name, company (e.g. Google, CRED), or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Paywall Status Alert */}
          {!isVIP ? (
            <div className="mt-4 p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Recruiter Inboxes Protected — VIP Access Enforced</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Free directory shows masked emails (e.g. <span className="font-mono font-semibold">ga***@zerodha.com</span>). Unlock verified inboxes and direct outreach drafts with VIP.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenVIP ? onOpenVIP() : window.location.hash = 'vip'}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-xs whitespace-nowrap transition-all cursor-pointer shrink-0"
              >
                Unlock VIP Access (₹75 / $9.99)
              </button>
            </div>
          ) : (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-900">
              <div className="flex items-center gap-2.5">
                <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-950">
                  VIP Active: All 20+ Verified Recruiter Inboxes Unmasked & 1-Click Outreach Drafter Enabled
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                VIP Unlocked
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recruiter Leads Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse space-y-4">
              <div className="h-5 w-2/3 bg-slate-100 rounded"></div>
              <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
              <div className="h-10 w-full bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No recruiters found</h3>
          <p className="text-xs text-slate-500">Try a different search query or clear your input.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Company & Verification */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-bold tracking-tight">
                      <Building2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>{contact.company}</span>
                    </span>
                    {contact.company_website && (
                      <a
                        href={contact.company_website.startsWith('http') ? contact.company_website : `https://${contact.company_website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-blue-600"
                        title="Company Website"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Lead</span>
                  </span>
                </div>

                {/* Name & Title */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {contact.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {contact.title || 'Technical Recruiter'}
                  </p>
                </div>

                {/* Niche & Location */}
                <div className="space-y-1">
                  {contact.company_niche && (
                    <span className="inline-block text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {contact.company_niche}
                    </span>
                  )}
                  {contact.location && (
                    <p className="text-[11px] text-slate-400">
                      {contact.location}
                    </p>
                  )}
                </div>

                {/* Corporate Email Pill */}
                {contact.email && (
                  contact.is_locked ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/90 text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-mono text-slate-700 truncate tracking-wide font-medium">{contact.email}</span>
                      </div>
                      <button
                        onClick={() => onOpenVIP ? onOpenVIP() : window.location.hash = 'vip'}
                        className="px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                        title="Unlock direct recruiter email"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Unlock</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800">
                      <span className="truncate">{contact.email}</span>
                      <button
                        onClick={(e) => copyEmail(e, contact.id, contact.email)}
                        className="p-1 hover:text-blue-600 transition-colors cursor-pointer ml-2 shrink-0"
                        title="Copy Email"
                      >
                        {copiedId === contact.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {contact.email && (
                    contact.is_locked ? (
                      <button
                        onClick={() => onOpenVIP ? onOpenVIP() : window.location.hash = 'vip'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                        title="Unlock Recruiter Email"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Unlock Email</span>
                      </button>
                    ) : (
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </a>
                    )
                  )}

                  {contact.linkedin_url && (
                    <a
                      href={contact.linkedin_url.startsWith('http') ? contact.linkedin_url : `https://${contact.linkedin_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                      title="View LinkedIn Profile"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                      </svg>
                      <span>Profile</span>
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleOpenDraftModal(contact)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-black text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Draft Outreach</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recruiter Outreach Drafter Modal */}
      {activeModalContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Recruiter Cold Outreach</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Message {activeModalContact.name} ({activeModalContact.company})
                </h3>
                <p className="text-xs text-slate-500">
                  {activeModalContact.title}
                </p>
              </div>
              <button
                onClick={() => setActiveModalContact(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Background & Core Tech Stack
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Engineer experienced in React, Node.js, Python & AWS"
                  value={candidateBg}
                  onChange={(e) => setCandidateBg(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleGenerateDraft}
                disabled={isDrafting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isDrafting ? 'Drafting Tailored Outreach...' : 'Generate Cold Outreach Note'}</span>
              </button>
            </div>

            {/* Generated Output */}
            {draftResult && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Subject</span>
                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-800 border border-slate-200">
                    {draftResult.subject}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Email Body</span>
                  <textarea
                    rows={8}
                    readOnly
                    value={draftResult.body}
                    className="w-full p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-800 border border-slate-200 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(draftResult.body);
                      setDraftCopied(true);
                      setTimeout(() => setDraftCopied(false), 2000);
                    }}
                    className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {draftCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{draftCopied ? 'Copied to Clipboard!' : 'Copy Outreach Note'}</span>
                  </button>

                  {draftResult.mailto_url && (
                    <a
                      href={draftResult.mailto_url}
                      className="flex-1 py-2 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Open in Email App</span>
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
