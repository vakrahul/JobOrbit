import React, { useState, useEffect } from 'react';
import PublicHero from './PublicHero';
import JobDetailModal from './JobDetailModal';
import { 
  Search, 
  MapPin, 
  Banknote, 
  Calendar, 
  ExternalLink, 
  Mail, 
  Copy, 
  Check, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Building2, 
  Globe, 
  Send, 
  Home, 
  CheckCircle2, 
  ArrowRight, 
  Briefcase,
  Bookmark
} from 'lucide-react';

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

export default function MainPage({ onGoToAdmin, stats, onOpenJob, onOpenVIP, currentUser, onOpenAuth }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [jobType, setJobType] = useState('all');
  const [batch, setBatch] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [newTodayOnly, setNewTodayOnly] = useState(false);
  const [vipOnly, setVipOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 9721, global_total: 9721, total_pages: 1 });
  const [selectedJob, setSelectedJob] = useState(null);
  const [vipCheckoutOpen, setVipCheckoutOpen] = useState(false);
  const [copiedEmailId, setCopiedEmailId] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  // Fetch saved jobs from backend tracker
  const fetchSavedJobs = async () => {
    try {
      const res = await fetch('/api/tracker');
      const data = await res.json();
      if (data.status === 'success' && data.items) {
        setSavedJobIds(new Set(data.items.map(item => item.job_id)));
      }
    } catch (e) {
      console.error("Failed to load saved jobs:", e);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleToggleBookmark = async (e, job) => {
    e.stopPropagation();
    const isCurrentlySaved = savedJobIds.has(job.id);
    
    // Optimistic state toggle
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(job.id);
      else next.add(job.id);
      return next;
    });

    try {
      if (isCurrentlySaved) {
        await fetch(`/api/tracker/${job.id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/tracker/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: job.id, status: 'saved' })
        });
      }
    } catch (err) {
      console.error("Tracker save failed:", err);
      fetchSavedJobs();
    }
  };

  const handleApplyClick = (e, job) => {
    // 1. MUST BE LOGGED IN / SIGNED UP FIRST
    const activeUser = currentUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('joborbit_user') || 'null') : null);
    if (!activeUser) {
      e.preventDefault();
      e.stopPropagation();
      if (onOpenAuth) {
        onOpenAuth("Please create a free account or sign in to access direct verified applications.");
      } else {
        alert("Please create a free account or sign in to access direct application links.");
      }
      return false;
    }

    // 2. VIP EXCLUSIVE GATING
    const isVip = typeof window !== 'undefined' && localStorage.getItem('joborbit_is_vip') === 'true';
    if (job?.is_vip_exclusive && !isVip) {
      e.preventDefault();
      e.stopPropagation();
      alert("VIP Exclusive Drop!\n\nThis role is reserved for JobOrbit VIP Members (₹75/mo).\n\nUpgrade to unlock direct 1-click ATS application links, 5-hour real-time drops, and HR recruiter contacts.");
      if (onOpenVIP) {
        onOpenVIP();
      } else {
        window.location.hash = 'vip';
      }
      return false;
    }

    // 3. FREE ACCOUNT TRIAL APPLICATION LIMIT (5 APPLICATIONS)
    if (!isVip) {
      const count = typeof window !== 'undefined' ? parseInt(localStorage.getItem('joborbit_applied_count') || '0', 10) : 0;
      if (count >= 5) {
        e.preventDefault();
        e.stopPropagation();
        alert("Free Trial Limit Reached (5/5 Applications Used)!\n\nDuring your free trial, accounts are limited to 5 applications.\n\nUpgrade to VIP Pass (₹75 / $9.99) for unlimited direct applications and real-time drops!");
        if (onOpenVIP) {
          onOpenVIP();
        } else {
          window.location.hash = 'vip';
        }
        return false;
      }
      localStorage.setItem('joborbit_applied_count', (count + 1).toString());
    }

    return true;
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24'
      });
      if (search) params.append('q', search);
      if (region !== 'all') params.append('region', region);
      if (jobType !== 'all') params.append('type', jobType);
      if (batch !== 'all') params.append('batch', batch);
      if (locationFilter !== 'all') params.append('location', locationFilter);
      if (remoteOnly) params.append('remote', 'true');
      if (newTodayOnly) params.append('new_today', 'true');
      if (vipOnly) params.append('vip_only', 'true');

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setJobs(data.jobs || []);
        setPagination(data.pagination || { total: 0, global_total: 9721, total_pages: 1 });
      }
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, region, jobType, batch, locationFilter, remoteOnly, newTodayOnly, vipOnly]);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const copyEmail = (e, id, email) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Invisible Honeypot Trap for Automated Crawlers */}
      <a
        href="/api/jobs/export-all"
        style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
        rel="nofollow"
      >
        Developer Bulk Job Dump
      </a>
      
      {/* Clean Modern Public Hero */}
      <PublicHero
        search={search}
        setSearch={setSearch}
        onSearchSubmit={handleHeroSearch}
        totalJobs={stats?.stats?.total_jobs || pagination.global_total || 9721}
        indiaJobs={stats?.stats?.india_jobs || 3880}
        globalJobs={stats?.stats?.global_jobs || 5841}
        newToday={stats?.stats?.new_today || 192}
        onExploreClick={() => {
          const el = document.getElementById('jobs-board');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onVIPClick={() => setVipCheckoutOpen(true)}
      />

      {/* Early Access VIP Banner */}
      <div id="vip-section" className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white">
              VIP EARLY ACCESS
            </span>
            <span className="text-xs font-semibold text-amber-900">
              192 new opportunities added today
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            Apply 6–8 hours before listings are broadcasted on LinkedIn & Telegram
          </h3>
          <p className="text-xs text-slate-600">
            Gain an asymmetric advantage over thousands of competing candidates. Full access from ₹75/month ($9.99 Global).
          </p>
        </div>

        <button
          onClick={() => onOpenVIP ? onOpenVIP() : setVipCheckoutOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <span>Claim Priority Access — ₹75 / $9.99</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Jobs Directory Section */}
      <div id="jobs-board" className="space-y-5 pt-2">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Explore Available Positions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Showing <strong className="text-slate-900">{pagination.total?.toLocaleString() || 0}</strong> matching roles (out of <strong className="text-slate-900">{(pagination.global_total || 7477).toLocaleString()}</strong> total opportunities)
            </p>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleHeroSearch} className="w-full md:w-80 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by role or skill..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Filters Bar: Region, Type, Batch, Location, Remote */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center gap-3">
          
          {/* Region */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={region}
              onChange={(e) => { setRegion(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Regions</option>
              <option value="India">India ({stats?.stats?.india_jobs?.toLocaleString() || '3,880'})</option>
              <option value="Global / US">Global / US ({stats?.stats?.global_jobs?.toLocaleString() || '5,841'})</option>
            </select>
          </div>

          {/* Job Type */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={jobType}
              onChange={(e) => { setJobType(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
            </select>
          </div>

          {/* Location Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Locations</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Gurugram">Gurugram / Gurgaon</option>
              <option value="Pune">Pune</option>
              <option value="Noida">Noida / Delhi NCR</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Amsterdam">Amsterdam</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          {/* Batch Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={batch}
              onChange={(e) => { setBatch(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Batches</option>
              <option value="2024">Batch 2024</option>
              <option value="2025">Batch 2025</option>
              <option value="2026">Batch 2026</option>
              <option value="2027">Batch 2027</option>
              <option value="2028">Batch 2028</option>
              <option value="2029">Batch 2029</option>
            </select>
          </div>

          {/* Remote Toggle */}
          <button
            onClick={() => { setRemoteOnly(!remoteOnly); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              remoteOnly 
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Remote Only</span>
          </button>

          {/* VIP Drops Filter */}
          <button
            onClick={() => { setVipOnly(!vipOnly); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              vipOnly 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500 shadow-xs' 
                : 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>VIP Drops</span>
            {vipOnly && <Check className="w-3.5 h-3.5" />}
          </button>

          {/* New Today Toggle */}
          <label className="flex items-center gap-2 cursor-pointer ml-auto text-xs font-semibold select-none bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200">
            <input
              type="checkbox"
              checked={newTodayOnly}
              onChange={(e) => { setNewTodayOnly(e.target.checked); setPage(1); }}
              className="rounded border-amber-300 text-amber-600 focus:ring-0 cursor-pointer"
            />
            <span>New Today Only</span>
          </label>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="py-24 text-center bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-medium text-slate-500">
              Loading verified opportunities...
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-slate-200 p-8">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No matching jobs found</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or changing your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const isEmail = job.is_email_apply || (job.apply_url && job.apply_url.startsWith('mailto:'));
              const rawEmail = job.email_recipient || (isEmail ? job.apply_url.replace('mailto:', '').split('?')[0] : null);

              return (
                <div 
                  key={job.id} 
                  className="job-card p-5 flex flex-col justify-between relative group cursor-pointer"
                  onClick={() => onOpenJob ? onOpenJob(job.id) : (window.location.hash = `job-${job.id}`)}
                >
                  <div className="space-y-3">
                    {/* Header Row: Company & Badges */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide truncate max-w-[150px]">
                        {job.company}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {/* Distinct Source Platform Badge */}
                        {job.is_vip_exclusive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-2xs">
                            <span>VIP Drop</span>
                          </span>
                        )}

                        {job.source_platform ? (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            job.source_platform.id === 'linkedin'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : job.source_platform.id === 'internshala'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                              : job.source_platform.id === 'wellfound'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            
                            {job.source_platform.badge_label || job.source}
                          </span>
                        ) : job.source ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {job.source}
                          </span>
                        ) : null}

                        {job.posted_date_text === 'Today' || job.is_new_today ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Today</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {job.posted_date_text || 'Recently'}
                          </span>
                        )}
                        {job.is_remote && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                            REMOTE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Job Title */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {job.title}
                    </h3>

                    {/* Meta Chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{job.pay}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[130px]">{job.location}</span>
                      </div>
                      <span>•</span>
                      <span className="text-slate-500 font-medium">{job.type}</span>
                    </div>

                    {/* Batch Eligibility if available */}
                    {job.batch && (
                      <div className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md inline-block">
                        Batch {job.batch} Eligible
                      </div>
                    )}

                    {/* If Direct Email Available: Display Dedicated Box */}
                    {isEmail && rawEmail && (
                      <div 
                        className="p-2.5 rounded-lg bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="text-xs font-medium text-purple-900 truncate">
                            {rawEmail}
                          </span>
                        </div>
                        <button
                          onClick={(e) => copyEmail(e, job.id, rawEmail)}
                          className="p-1 rounded hover:bg-purple-200/60 text-purple-700 transition-colors shrink-0"
                          title="Copy HR email"
                        >
                          {copiedEmailId === job.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Snippet */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {job.snippet || job.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div 
                    className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {job.is_vip_exclusive && !(typeof window !== 'undefined' && localStorage.getItem('joborbit_is_vip') === 'true') ? (
                      // VIP GATED BUTTON
                      <button
                        onClick={(e) => handleApplyClick(e, job)}
                        className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Unlock VIP Drop (₹75)</span>
                      </button>
                    ) : isEmail && rawEmail ? (
                      // EMAIL HR DIRECT BUTTON
                      <a
                        href={`mailto:${rawEmail}?subject=Application for ${encodeURIComponent(job.title)} - ${encodeURIComponent(job.company)}`}
                        onClick={(e) => handleApplyClick(e, job)}
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Email to HR</span>
                      </a>
                    ) : (job.apply_url || job.source_url) ? (
                      // DIRECT EXTERNAL APPLICATION LINK
                      <a
                        href={getSafeApplyUrl(job)}
                        onClick={(e) => handleApplyClick(e, job)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Apply on Careers</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      // DETAILS FALLBACK
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>View Details</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenJob) {
                          onOpenJob(job.id);
                        } else {
                          window.location.hash = `job-${job.id}`;
                        }
                      }}
                      className="py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      Details
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, job)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer shrink-0 ${
                        savedJobIds.has(job.id)
                          ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                      title={savedJobIds.has(job.id) ? "Saved to Application Tracker" : "Save to Application Tracker"}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${savedJobIds.has(job.id) ? 'fill-blue-600 text-blue-600' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs text-slate-500">
            <span>
              Page <strong className="text-slate-900 font-bold">{pagination.page}</strong> of <strong className="text-slate-900 font-bold">{pagination.total_pages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 350, behavior: 'smooth' }); }}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => { setPage((p) => Math.min(pagination.total_pages, p + 1)); window.scrollTo({ top: 350, behavior: 'smooth' }); }}
                disabled={page >= pagination.total_pages}
                className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* VIP Checkout Modal */}
      {vipCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 text-center animate-in fade-in zoom-in-95">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>EARLY ACCESS MEMBERSHIP</span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 leading-snug">
              Apply 6–8 Hours Ahead of Thousands of Applicants
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              When new high-paying tech jobs and internships drop, early applicants have an 80% higher interview callback rate.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>6–8 Hour Priority Application Window</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified Direct HR Recruiter Inboxes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direct Employer Career Links (Zero Redirects)</span>
              </div>
            </div>

            <div className="text-3xl font-extrabold text-slate-900">
              ₹75 <span className="text-xs font-normal text-slate-500">/ month ($9.99 Global)</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setVipCheckoutOpen(false);
                  if (onOpenVIP) onOpenVIP();
                  else window.location.hash = 'vip';
                }}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
              >
                Proceed to VIP Checkout (₹75 / $9.99)
              </button>
              <button
                onClick={() => setVipCheckoutOpen(false)}
                className="py-3 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onOpenVIP={onOpenVIP}
        />
      )}

    </div>
  );
}
