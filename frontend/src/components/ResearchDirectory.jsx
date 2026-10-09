import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  Building2, 
  Mail, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  BookOpen,
  Send,
  X
} from 'lucide-react';

export default function ResearchDirectory({ onDraftEmail }) {
  const [professors, setProfessors] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 292, total_pages: 1 });
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [activeModalProf, setActiveModalProf] = useState(null);

  // Email drafter state
  const [candidateName, setCandidateName] = useState('');
  const [candidateBg, setCandidateBg] = useState('Computer Science undergraduate with ML & systems experience');
  const [draftResult, setDraftResult] = useState(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);

  const fetchProfessors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24'
      });
      if (search) params.append('q', search);
      if (selectedInstitute !== 'all') params.append('institute', selectedInstitute);

      const res = await fetch(`/api/research?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setProfessors(data.professors || []);
        setPagination(data.pagination || { total: 0, total_pages: 1 });
        if (data.institutes?.length > 0 && institutes.length === 0) {
          setInstitutes(data.institutes);
        }
      }
    } catch (e) {
      console.error("Failed to fetch research professors:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, [page, selectedInstitute]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProfessors();
  };

  const copyEmail = (e, email) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleOpenDraftModal = (prof) => {
    setActiveModalProf(prof);
    setDraftResult(null);
    setDraftCopied(false);
  };

  const handleGenerateDraft = async () => {
    if (!activeModalProf) return;
    setIsDrafting(true);
    try {
      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'professor',
          target_id: activeModalProf.id,
          candidate_name: candidateName || 'Prospective Intern',
          candidate_background: candidateBg
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDraftResult(data);
      }
    } catch (e) {
      console.error("Failed to draft email:", e);
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
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Research & Lab Internships</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Research Internships Under Top Professors
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            Direct access to {pagination.total || 290}+ faculty research labs across IITs, IISc, NITs, and IIITs. Reach out directly with zero intermediaries or generate cold outreach emails in seconds.
          </p>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search professor, institute (e.g. IIT Bombay), or area (e.g. AI, Robotics)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Search</span>
            </button>
          </form>
        </div>
      </div>

      {/* Institute Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => { setSelectedInstitute('all'); setPage(1); }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
            selectedInstitute === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
          }`}
        >
          All Institutes ({pagination.total || 292})
        </button>

        {institutes.slice(0, 10).map((inst) => (
          <button
            key={inst.name}
            onClick={() => { setSelectedInstitute(inst.name); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              selectedInstitute === inst.name
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {inst.name} ({inst.count})
          </button>
        ))}
      </div>

      {/* Grid of Professor Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse space-y-4">
              <div className="h-5 w-3/4 bg-slate-100 rounded"></div>
              <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
              <div className="h-16 w-full bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : professors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No professors found</h3>
          <p className="text-xs text-slate-500">Try broadening your search term or select "All Institutes".</p>
          <button
            onClick={() => { setSearch(''); setSelectedInstitute('all'); setPage(1); }}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {professors.map((prof) => (
            <div
              key={prof.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Institute Badge & Lab Link */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold tracking-wide">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>{prof.institute}</span>
                  </span>

                  {prof.website_url && (
                    <a
                      href={prof.website_url.startsWith('http') ? prof.website_url : `https://${prof.website_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                      title="Lab / Faculty Website"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Name & Department */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {prof.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {prof.department}
                  </p>
                </div>

                {/* Research Areas */}
                {prof.research_areas && (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Research Domains
                    </span>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {prof.research_areas}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`mailto:${prof.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>

                  <button
                    onClick={(e) => copyEmail(e, prof.email)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Copy Email Address"
                  >
                    {copiedEmail === prof.email ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => handleOpenDraftModal(prof)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Draft with AI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500 font-medium">
            Showing Page {page} of {pagination.total_pages} ({pagination.total} professors)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-700">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cold Email Drafter Modal */}
      {activeModalProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Academic Outreach Drafter</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Contact Prof. {activeModalProf.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeModalProf.department} · {activeModalProf.institute}
                </p>
              </div>
              <button
                onClick={() => setActiveModalProf(null)}
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
                  Your Background & Technical Skills
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3rd year B.Tech in CSE with PyTorch, NLP & Docker experience"
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
                <span>{isDrafting ? 'Drafting Tailored Email...' : 'Generate Academic Outreach Email'}</span>
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
                    <span>{draftCopied ? 'Copied to Clipboard!' : 'Copy Email Body'}</span>
                  </button>

                  <a
                    href={draftResult.mailto_url}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Open in Email App</span>
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
