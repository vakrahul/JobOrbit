import React, { useState } from 'react';
import { X, MapPin, Banknote, Calendar, ExternalLink, Mail, Copy, Check, Building2, Clock, Bookmark } from 'lucide-react';

export default function JobDetailModal({ job, onClose, currentUser, onOpenAuth, onOpenVIP }) {
  const [emailCopied, setEmailCopied] = useState(false);
  const [fullDesc, setFullDesc] = useState(job?.description || '');
  const [isSaved, setIsSaved] = useState(false);
  const [savingTracker, setSavingTracker] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(null);

  const copyTemplateSnippet = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTemplate(type);
    setTimeout(() => setCopiedTemplate(null), 2500);
  };



  React.useEffect(() => {
    if (job?.id) {
      fetch('/api/tracker')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.items) {
            setIsSaved(data.items.some(i => i.job_id === job.id));
          }
        })
        .catch(() => {});
    }
  }, [job?.id]);

  const handleToggleSave = async () => {
    if (!job?.id) return;
    setSavingTracker(true);
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      if (!nextSaved) {
        await fetch(`/api/tracker/${job.id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/tracker/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: job.id, status: 'saved' })
        });
      }
    } catch (e) {
      console.error("Save error:", e);
      setIsSaved(!nextSaved);
    } finally {
      setSavingTracker(false);
    }
  };

  React.useEffect(() => {
    if (job?.id && (!job.description || job.description.length < 200 || job.description.endsWith('opportunity.'))) {
      fetch(`/api/jobs/${job.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.job?.description) {
            setFullDesc(data.job.description);
          }
        })
        .catch(err => console.error("Error loading description:", err));
    } else if (job?.description) {
      setFullDesc(job.description);
    }
  }, [job?.id]);

  if (!job) return null;

  const isEmail = job.is_email_apply || (job.apply_url && job.apply_url.startsWith('mailto:'));
  const rawEmail = job.email_recipient || (isEmail ? job.apply_url.replace('mailto:', '').split('?')[0] : null);

  const copyEmail = () => {
    if (!rawEmail) return;
    navigator.clipboard.writeText(rawEmail);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2500);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applicantName || !applicantEmail) {
      setErrorMessage("Please enter your name and email.");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: applicantName,
          email: applicantEmail,
          resume_link: applicantResume,
          cover_note: coverNote
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setErrorMessage(data.message || "Failed to submit application.");
      }
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyClick = (e) => {
    const activeUser = currentUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('joborbit_user') || 'null') : null);
    if (!activeUser) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      onClose?.();
      onOpenAuth?.("Please create a free account or sign in to access direct verified applications.");
      return false;
    }

    const isVip = typeof window !== 'undefined' && localStorage.getItem('joborbit_is_vip') === 'true';
    if (job?.is_vip_exclusive && !isVip) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      onClose?.();
      alert("VIP Exclusive Drop!\n\nThis role is reserved for JobOrbit VIP Members (₹75/mo).\n\nUpgrade to unlock direct 1-click ATS application links, 5-hour real-time drops, and HR recruiter contacts.");
      if (onOpenVIP) onOpenVIP();
      else window.location.hash = 'vip';
      return false;
    }

    if (!isVip) {
      const count = typeof window !== 'undefined' ? parseInt(localStorage.getItem('joborbit_applied_count') || '0', 10) : 0;
      if (count >= 5) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        onClose?.();
        alert("Free Trial Limit Reached (5/5 Applications Used)!\n\nDuring your free trial, accounts are limited to 5 applications.\n\nUpgrade to VIP Pass (₹75 / $9.99) for unlimited direct applications and real-time drops!");
        if (onOpenVIP) onOpenVIP();
        else window.location.hash = 'vip';
        return false;
      }
      localStorage.setItem('joborbit_applied_count', (count + 1).toString());
    }

    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-blue-600">
                {job.company}
              </span>

              {/* VIP Badge */}
              {job.is_vip_exclusive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-black rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-2xs">
                  <span>VIP Exclusive Drop</span>
                </span>
              )}

              {/* Source Badge */}
              {job.source_platform ? (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  job.source_platform.id === 'linkedin'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : job.source_platform.id === 'internshala'
                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                    : job.source_platform.id === 'wellfound'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  
                  {job.source_platform.badge_label || job.source}
                </span>
              ) : null}

              {job.posted_date_text === 'Today' || job.is_new_today ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Added Today</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Posted {job.posted_date_text || 'Recently'}
                </span>
              )}
              {job.is_remote && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                  Remote
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                {job.region || 'India'}
              </span>
            </div>


            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {job.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={savingTracker}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                isSaved
                  ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
              }`}
              title={isSaved ? "Saved to Application Tracker" : "Save to Application Tracker"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={() => {
                if (!handleApplyClick()) return;

                // Resolve the best external URL to open — prefer direct apply URL, then external source_url
                const externalTarget =
                  (job.is_external_apply && job.apply_url) ||
                  (job.source_url && job.source_url.startsWith('http') ? job.source_url : null) ||
                  (job.apply_url && job.apply_url.startsWith('http') ? job.apply_url : null);

                if (externalTarget && !externalTarget.startsWith('mailto:')) {
                  window.open(externalTarget, '_blank', 'noopener,noreferrer');
                } else if (job.apply_url && job.apply_url.startsWith('mailto:')) {
                  window.location.href = job.apply_url;
                } else {
                  // fallback
                  onClose();
                  window.location.hash = `job-${job.id}`;
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="Open original application page"
            >
              <span>Open Next Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Key Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">Location</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm font-semibold text-slate-800">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-700 font-medium block">Compensation</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm font-bold text-emerald-800">
                <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{job.pay}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-500 font-medium block">Job Type</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm font-semibold text-slate-800">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{job.type}</span>
              </div>
            </div>

            {job.batch && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 col-span-2 sm:col-span-3">
                <span className="text-xs text-purple-700 font-medium block">Graduation Batch Eligibility</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-sm font-bold text-purple-900">
                  <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Batch {job.batch} Eligible</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              About the Role & Requirements
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {fullDesc || job.description || job.snippet || "Standard enterprise role details indexed directly from employer hiring page."}
            </div>
          </div>

          {/* Platform Tailored Ready Template */}
          {job.ready_template && (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              job.ready_template.platform === 'linkedin'
                ? 'bg-blue-50/70 border-blue-200'
                : job.ready_template.platform === 'internshala'
                ? 'bg-cyan-50/70 border-cyan-200'
                : job.ready_template.platform === 'wellfound'
                ? 'bg-purple-50/70 border-purple-200'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    job.ready_template.platform === 'linkedin' ? 'bg-blue-600 animate-pulse' :
                    job.ready_template.platform === 'internshala' ? 'bg-cyan-600 animate-pulse' :
                    job.ready_template.platform === 'wellfound' ? 'bg-purple-600 animate-pulse' : 'bg-emerald-600 animate-pulse'
                  }`}></span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {job.ready_template.template_type || 'Tailored Outreach Kit'}
                  </h4>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  job.ready_template.platform === 'linkedin' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  job.ready_template.platform === 'internshala' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                  job.ready_template.platform === 'wellfound' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {job.ready_template.badge_label || job.source}
                </span>
              </div>

              {/* Short Note: Connection Request or Why Hire Me */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    {job.ready_template.platform === 'linkedin' 
                      ? 'LinkedIn Connection Request Note (<300 chars)'
                      : job.ready_template.platform === 'internshala'
                      ? 'Internshala "Why should you be hired?" Answer'
                      : job.ready_template.platform === 'wellfound'
                      ? 'Wellfound Founder Direct Pitch'
                      : 'Short Outreach Intro'}
                  </span>
                  <button
                    onClick={() => copyTemplateSnippet(job.ready_template.connection_note, 'note')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedTemplate === 'note' ? (
                      <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-700 font-bold">Copied!</span></>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /><span>Copy Note</span></>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-800 font-mono select-all leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {job.ready_template.connection_note}
                </p>
              </div>

              {/* Full InMail / Email Cover Letter Pitch */}
              {job.ready_template.email_pitch && (
                <div className="mt-3 space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {job.ready_template.platform === 'linkedin'
                        ? 'LinkedIn InMail / Email Outreach Pitch'
                        : job.ready_template.platform === 'internshala'
                        ? 'Cover Letter Pitch'
                        : job.ready_template.platform === 'wellfound'
                        ? 'Startup Founder Note'
                        : 'Cover Letter Pitch'}
                    </span>
                    <button
                      onClick={() => copyTemplateSnippet(
                        `Subject: ${job.ready_template.email_subject}\n\n${job.ready_template.email_pitch}`,
                        'pitch'
                      )}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedTemplate === 'pitch' ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-700 font-bold">Copied!</span></>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /><span>Copy Full Pitch</span></>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap select-all leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-h-36 overflow-y-auto">
                    {job.ready_template.email_pitch}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Application Options */}
          <div className="pt-2">
            {(() => {
              const hasExternal = job.is_external_apply && job.apply_url && !job.apply_url.startsWith('mailto:');
              const hasEmail = isEmail && rawEmail;
              const fallbackUrl = (job.source_url && job.source_url.startsWith('http')) ? job.source_url : (job.apply_url && job.apply_url.startsWith('http') ? job.apply_url : null);

              if (hasEmail) {
                return (
                  <div className="p-5 rounded-xl bg-purple-50 border border-purple-200 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-purple-600 text-white shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-purple-950">Direct HR Recruiter Inbox</h4>
                        <p className="text-xs text-purple-700 mt-0.5">
                          This company accepts direct applications via email.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-purple-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs font-medium text-slate-500">To:</span>
                        <span className="text-sm font-bold text-slate-900 font-mono select-all truncate">{rawEmail}</span>
                      </div>
                      <button
                        onClick={copyEmail}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        {emailCopied ? (
                          <><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Copied!</span></>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /><span>Copy Email</span></>
                        )}
                      </button>
                    </div>

                    <a
                      href={`mailto:${rawEmail}?subject=Application for ${encodeURIComponent(job.title)} - ${encodeURIComponent(job.company)}`}
                      onClick={(e) => handleApplyClick(e)}
                      className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Open Email App &amp; Apply</span>
                    </a>
                  </div>
                );
              }

              let applyUrl = hasExternal ? job.apply_url : fallbackUrl;
              if (applyUrl && (applyUrl.toLowerCase().includes('carrerlift') || applyUrl.toLowerCase().includes('careerlift'))) {
                applyUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(((job.company || '') + ' ' + (job.title || '')).trim())}`;
              }

              const isUserVip = typeof window !== 'undefined' && localStorage.getItem('joborbit_is_vip') === 'true';

              return (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Official Employer Application</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        You'll be redirected to <strong>{job.company}</strong>'s original hiring page.
                      </p>
                    </div>
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>

                  {job.is_vip_exclusive && !isUserVip ? (
                    <button
                      onClick={(e) => handleApplyClick(e)}
                      className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Unlock VIP Drop with VIP Pass (₹75)</span>
                    </button>
                  ) : applyUrl ? (
                    <a
                      href={applyUrl}
                      onClick={(e) => handleApplyClick(e)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Apply on {job.company} Careers</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">
                      No direct application link available for this listing.
                    </p>
                  )}
                </div>
              );
            })()}
          </div>


        </div>

      </div>
    </div>
  );
}
