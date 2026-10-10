import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Banknote, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Mail, 
  Copy, 
  Check, 
  Share2, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Bookmark,
  Send,
  X,
  AlertCircle
} from 'lucide-react';
import JobDetailModal from './JobDetailModal';

export function getSafeApplyUrl(job) {
  if (!job) return '#';
  const raw = (job.apply_url || job.source_url || '').trim();

  if (raw.toLowerCase().startsWith('mailto:')) {
    return raw;
  }

  if (raw.toLowerCase().includes('carrerlift') || raw.toLowerCase().includes('careerlift')) {
    const q = encodeURIComponent(`${job.company || ''} ${job.title || ''}`.trim());
    return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
  }

  if (raw.startsWith('/') || (!raw.startsWith('http://') && !raw.startsWith('https://'))) {
    const q = encodeURIComponent(`${job.company || ''} ${job.title || ''}`.trim());
    return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
  }

  return raw;
}

export default function JobDetailPage({ jobId, onBack, currentUser, onOpenAuth, onOpenVIP }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState([]);
  
  // Tracking & AI Fit Check state
  const [isSaved, setIsSaved] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [aiFitOpen, setAiFitOpen] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [evaluatingFit, setEvaluatingFit] = useState(false);
  const [fitResult, setFitResult] = useState(null);

  // Email Drafter state
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateBg, setCandidateBg] = useState('Full Stack / Software Engineer with React & Python');
  const [draftingEmail, setDraftingEmail] = useState(false);
  const [draftResult, setDraftResult] = useState(null);
  const [draftCopied, setDraftCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);

    const loadJobDetails = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (data.status === 'success' && data.job) {
          setJob(data.job);

          // Fetch 3 related jobs from the same region/type
          try {
            const relRes = await fetch(`/api/jobs?region=${encodeURIComponent(data.job.region || 'India')}&type=${encodeURIComponent(data.job.type || 'Internship')}&limit=3`);
            const relData = await relRes.json();
            if (relData.status === 'success') {
              setRelatedJobs((relData.jobs || []).filter(j => j.id !== Number(jobId)).slice(0, 3));
            }
          } catch (relErr) {
            console.error("Related jobs error:", relErr);
          }
        }
      } catch (err) {
        console.error("Failed to load job details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleToggleSave = async () => {
    setSavingLoading(true);
    try {
      if (isSaved) {
        await fetch(`/api/tracker/${jobId}`, { method: 'DELETE' });
        setIsSaved(false);
      } else {
        await fetch('/api/tracker/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId, status: 'saved' })
        });
        setIsSaved(true);
      }
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSavingLoading(false);
    }
  };

  const handleApplyClick = (e) => {
    const activeUser = currentUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('joborbit_user') || 'null') : null);
    if (!activeUser) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      onOpenAuth?.("Please create a free account or sign in to access direct verified applications.");
      return false;
    }

    const isVip = typeof window !== 'undefined' && localStorage.getItem('joborbit_is_vip') === 'true';
    if (job?.is_vip_exclusive && !isVip) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      alert("VIP Exclusive Drop!\n\nThis role is reserved for JobOrbit VIP Members (₹75/mo).\n\nUpgrade to unlock direct 1-click ATS application links, 5-hour real-time drops, and HR recruiter contacts.");
      if (onOpenVIP) onOpenVIP();
      else window.location.hash = 'vip';
      return false;
    }

    if (!isVip) {
      const count = typeof window !== 'undefined' ? parseInt(localStorage.getItem('joborbit_applied_count') || '0', 10) : 0;
      if (count >= 5) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        alert("Free Trial Limit Reached (5/5 Applications Used)!\n\nDuring your 5-day trial, free accounts are limited to 5 applications.\n\nUpgrade to VIP Pass (₹75 / $9.99) for unlimited direct applications, 5-hour real-time drops, and unlocked recruiter corporate emails!");
        if (onOpenVIP) onOpenVIP();
        else window.location.hash = 'vip';
        return false;
      }
      localStorage.setItem('joborbit_applied_count', (count + 1).toString());
    }

    return true;
  };

  const handleEvaluateFit = async () => {
    if (!resumeText.trim()) return;
    setEvaluatingFit(true);
    try {
      const res = await fetch('/api/ai/fit-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, resume_text: resumeText })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setFitResult(data);
      }
    } catch (e) {
      console.error("Fit evaluation error:", e);
    } finally {
      setEvaluatingFit(false);
    }
  };

  const handleGenerateEmailDraft = async () => {
    setDraftingEmail(true);
    try {
      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'job',
          target_id: jobId,
          candidate_name: candidateName || 'Candidate',
          candidate_background: candidateBg
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDraftResult(data);
      }
    } catch (e) {
      console.error("Email drafting error:", e);
    } finally {
      setDraftingEmail(false);
    }
  };

  // Render nicely formatted description sections
  const renderFormattedDescription = (text) => {
    if (!text) return null;

    // Split text into paragraphs or blocks
    const lines = text.split('\n');
    const elements = [];
    let currentBulletList = [];

    const flushBulletList = (key) => {
      if (currentBulletList.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="space-y-2.5 my-3">
            {currentBulletList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-slate-700 text-sm leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        currentBulletList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushBulletList(index);
        return;
      }

      // Check if it's a section header (e.g. "About this role", "What you'll work on:", "What we're looking for:")
      if (
        trimmed.endsWith(':') || 
        trimmed.toLowerCase().startsWith('about this role') ||
        trimmed.toLowerCase().startsWith('what you\'ll work on') ||
        trimmed.toLowerCase().startsWith('what we\'re looking for') ||
        trimmed.toLowerCase().startsWith('key responsibilities') ||
        trimmed.toLowerCase().startsWith('qualifications') ||
        trimmed.toLowerCase().startsWith('how you\'ll work') ||
        trimmed.toLowerCase().startsWith('how to apply')
      ) {
        flushBulletList(index);
        elements.push(
          <h3 key={`h-${index}`} className="text-base font-bold text-slate-900 mt-6 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-blue-600 inline-block"></span>
            {trimmed.replace(/:$/, '')}
          </h3>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        currentBulletList.push(trimmed.substring(2));
      } else {
        flushBulletList(index);
        elements.push(
          <p key={`p-${index}`} className="text-sm text-slate-700 leading-relaxed my-2">
            {trimmed}
          </p>
        );
      }
    });

    flushBulletList('end');
    return elements;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-slate-200 rounded-lg"></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
          <div className="h-10 w-2/3 bg-slate-200 rounded-xl"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
          <div className="h-48 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Job Opportunity Not Found</h2>
        <p className="text-sm text-slate-500">The listing you are looking for may have been archived or moved.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Opportunities</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6 pb-20">
      
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to All Jobs</span>
        </button>

        <div className="flex items-center gap-2 text-slate-500">
          <span className="hover:text-slate-900 cursor-pointer" onClick={onBack}>Directory</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>{job.region}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-medium truncate max-w-[200px]">{job.company}</span>
        </div>
      </div>

      {/* Main Job Hero Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3">
            {/* Company & Verification */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-extrabold text-blue-700 uppercase tracking-wider text-sm">
                {job.company}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Opportunity
              </span>
              {job.is_vip_exclusive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold shadow-2xs">
                  <span>VIP Drop</span>
                </span>
              )}
              {job.is_new_today && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Added Today
                </span>
              )}
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-medium">{job.posted_date_text || 'Recently posted'}</span>
            </div>

            {/* Job Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {job.title}
            </h1>

            {/* Tags strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium text-slate-700">
                {job.type}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium text-slate-700">
                {job.location}
              </span>
              {job.is_remote && (
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  Remote Eligible
                </span>
              )}
              {job.batch && (
                <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                  Batch {job.batch} Eligible
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-500" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>

            {job.is_vip_exclusive && !(typeof window !== 'undefined' && localStorage.getItem('joborbit_is_vip') === 'true') ? (
              <button
                onClick={(e) => handleApplyClick(e)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Unlock VIP Drop with VIP Pass (₹75)</span>
              </button>
            ) : job.apply_url ? (
              <a
                href={getSafeApplyUrl(job)}
                onClick={(e) => handleApplyClick(e)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Apply on {job.company} Careers</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : job.is_email_apply ? (
              <a
                href={`mailto:${job.email_recipient}?subject=Application: ${encodeURIComponent(job.title)}`}
                onClick={(e) => handleApplyClick(e)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email to HR</span>
              </a>
            ) : (job.apply_url || job.source_url) ? (
              <a
                href={getSafeApplyUrl(job)}
                onClick={(e) => handleApplyClick(e)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Apply on {job.company} Careers</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={(e) => { if (handleApplyClick(e)) setApplyModalOpen(true); }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>View Job Details</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Specifications Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          
          {/* Compensation */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-xs text-emerald-700 font-semibold block">Compensation</span>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-extrabold text-emerald-800">
              <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{job.pay}</span>
            </div>
          </div>

          {/* Location */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">Location</span>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
          </div>

          {/* Job Type */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">Job Type</span>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-bold text-slate-800">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{job.type}</span>
            </div>
          </div>

          {/* Batch Eligibility */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <span className="text-xs text-purple-700 font-semibold block">Batch Eligibility</span>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-extrabold text-purple-800">
              <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="truncate">{job.batch ? `Batch ${job.batch}` : 'All Batches'}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Grid: Main Details & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Full Role Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span>About the Role & Requirements</span>
              </h2>
              <span className="text-xs text-slate-400">Complete Job Specification</span>
            </div>

            {/* Rich formatted description */}
            <div className="prose prose-slate max-w-none">
              {renderFormattedDescription(job.description || job.snippet)}
            </div>
          </div>

          {/* AI Resume Fit Analyzer */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI Resume Fit & Skills Match Check
                  </h3>
                  <p className="text-xs text-slate-500">
                    Compare your profile against {job.company}'s specific role requirements
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAiFitOpen(!aiFitOpen)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {aiFitOpen ? 'Hide Analyzer' : 'Check My Fit'}
              </button>
            </div>

            {aiFitOpen && (
              <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                <textarea
                  rows={4}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume summary or skills (e.g. Python, SQL, React, AWS, Docker)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  onClick={handleEvaluateFit}
                  disabled={evaluatingFit || !resumeText.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{evaluatingFit ? 'Evaluating Fit Score...' : 'Run Role Fit Analysis'}</span>
                </button>

                {fitResult && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Fit Evaluation Verdict:</span>
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                        {fitResult.fit_score}% — {fitResult.verdict}
                      </span>
                    </div>

                    {fitResult.strengths?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Key Strengths</span>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {fitResult.strengths.map((s, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {fitResult.gaps?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Recommended Focus Areas</span>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {fitResult.gaps.map((g, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verification & Trust Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-3.5 text-xs text-slate-600">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-800">Zero Middleman & Zero Redirect Guarantee</p>
              <p className="leading-relaxed">
                This position is indexed directly from {job.company}'s official public career feeds. JobOrbit does not intercept candidate credentials or inject sponsored intermediaries.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Apply Card & Recruiter Info */}
        <div className="space-y-6">
          
          {/* Action Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 sticky top-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
              Apply to {job.company}
            </h3>

            {job.is_vip_exclusive && !(typeof window !== 'undefined' && localStorage.getItem('joborbit_is_vip') === 'true') ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>VIP Exclusive Drop:</strong> This high-demand role requires JobOrbit VIP Access (₹75/mo) to unlock direct ATS application links and recruiter contacts.
                </p>
                <button
                  onClick={(e) => handleApplyClick(e)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                >
                  <span>Unlock VIP Drop (₹75)</span>
                </button>
              </div>
            ) : job.apply_url ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Applications are accepted directly through {job.company}'s official career site. Click below to launch the employer's official form.
                </p>
                <a
                  href={getSafeApplyUrl(job)}
                  onClick={(e) => handleApplyClick(e)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                >
                  <span>Open Official Application</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : job.is_email_apply ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  This hiring team accepts direct email applications to their talent acquisition contact.
                </p>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-purple-900 font-semibold truncate">
                    {job.email_recipient}
                  </span>
                  <button
                    onClick={() => handleCopyEmail(job.email_recipient)}
                    className="p-1 rounded bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <a
                  href={`mailto:${job.email_recipient}?subject=Application: ${encodeURIComponent(job.title)}`}
                  onClick={(e) => handleApplyClick(e)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Resume Email</span>
                </a>
              </div>
            ) : (
              <button
                onClick={(e) => { if (handleApplyClick(e)) setApplyModalOpen(true); }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <span>Submit Quick Application</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}

            {/* Candidate Power Tools */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleToggleSave}
                disabled={savingLoading}
                className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-blue-600 text-blue-600' : 'text-slate-400'}`} />
                <span>{isSaved ? 'Bookmarked in Tracker' : 'Save to My Applications'}</span>
              </button>

              <button
                onClick={() => setDraftModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Draft Application Note with AI</span>
              </button>
            </div>

            <hr className="border-slate-100" />

            {/* Role Metadata List */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Region:</span>
                <span className="font-medium text-slate-800">{job.region}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Position Type:</span>
                <span className="font-medium text-slate-800">{job.type}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Batch:</span>
                <span className="font-medium text-slate-800">{job.batch || 'Any eligible'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Direct Portal:</span>
                <span className="font-semibold text-emerald-700">Verified Direct</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Related Opportunities Bar */}
      {relatedJobs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Similar Opportunities in {job.region}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedJobs.map(rel => (
              <div
                key={rel.id}
                onClick={() => {
                  window.location.hash = `job-${rel.id}`;
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer bg-slate-50/50 hover:bg-white flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                    {rel.company}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                    {rel.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{rel.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-bold text-emerald-700">{rel.pay}</span>
                  <span className="text-blue-600 font-semibold flex items-center gap-1">
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal Application Modal if opened */}
      {applyModalOpen && (
        <JobDetailModal
          job={job}
          onClose={() => setApplyModalOpen(false)}
        />
      )}

      {/* AI Tailored Outreach Drafter Modal */}
      {draftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Application Letter & Outreach</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {job.title} at {job.company}
                </h3>
                <p className="text-xs text-slate-500">
                  Generate a tailored note for the hiring team or talent recruiter
                </p>
              </div>
              <button
                onClick={() => setDraftModalOpen(false)}
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
                  Your Core Experience / Tech Stack
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer with 1+ year building scalable web systems in React, Python & Docker"
                  value={candidateBg}
                  onChange={(e) => setCandidateBg(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleGenerateEmailDraft}
                disabled={draftingEmail}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{draftingEmail ? 'Drafting Application Note...' : 'Generate Tailored Outreach Note'}</span>
              </button>
            </div>

            {/* Generated Output */}
            {draftResult && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Subject Line</span>
                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-800 border border-slate-200">
                    {draftResult.subject}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Outreach Body</span>
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
                    <span>{draftCopied ? 'Copied to Clipboard!' : 'Copy Note'}</span>
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
