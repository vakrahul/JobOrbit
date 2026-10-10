import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Search, 
  MapPin, 
  Briefcase, 
  Code2, 
  Cpu, 
  Users, 
  Megaphone, 
  Banknote, 
  TrendingUp, 
  Palette, 
  Globe, 
  Star, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Building2,
  Mail,
  Lock
} from 'lucide-react';

export default function LandingPage({ 
  stats, 
  onExploreJobs, 
  onOpenResume, 
  onOpenAudit,
  onOpenVIP, 
  onOpenLegal,
  onOpenProfile,
  onOpenJob
}) {
  const totalJobs = stats?.stats?.total_jobs || 13538;
  const indiaJobs = stats?.stats?.india_jobs || 4479;
  const globalJobs = stats?.stats?.global_jobs || 8780;
  const newToday = stats?.stats?.new_today || 1792;
  const totalHr = stats?.stats?.total_hr || 1853;

  // Search Bar States
  const [keyword, setKeyword] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  
  // Featured Jobs State
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'remote', 'intern'

  // Reviews State
  const [communityReviews, setCommunityReviews] = useState(() => {
    try {
      const stored = localStorage.getItem('joborbit_community_reviews');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: '1',
        name: 'Aarav Mehta',
        role: 'Full-Stack SDE @ YC Startup',
        rating: 5,
        text: 'Applied to 3 roles within 2 hours of posting on JobOrbit. Received direct interview invite from the founder because my application hit their inbox before the LinkedIn post even went live.',
        date: 'Oct 8, 2026'
      },
      {
        id: '2',
        name: 'Sneha Rao',
        role: 'AI / ML Intern @ Bengaluru Lab',
        rating: 5,
        text: 'The direct recruiter corporate emails in the VIP pass are 100% authentic. Skipped the ATS black hole completely and got my summer 2026 internship offer.',
        date: 'Oct 6, 2026'
      },
      {
        id: '3',
        name: 'Vikram Joshi',
        role: 'Backend Engineer @ Series B SaaS',
        rating: 5,
        text: 'Cleanest interface with zero tracker redirects. White and cream card layout makes scanning salaries and tech stacks effortless.',
        date: 'Oct 4, 2026'
      }
    ];
  });

  // Fetch a sample of real featured jobs from backend
  useEffect(() => {
    const fetchFeatured = async () => {
      setLoadingJobs(true);
      try {
        const res = await fetch('/api/jobs?per_page=8');
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setFeaturedJobs(data.items);
          }
        }
      } catch (err) {
        console.error("Failed to load featured jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onExploreJobs) {
      onExploreJobs();
    } else {
      window.location.hash = 'explore';
    }
  };

  const handleCategoryClick = (categoryName) => {
    if (onExploreJobs) {
      onExploreJobs();
    } else {
      window.location.hash = 'explore';
    }
  };

  const popularKeywords = ['UI Designer', 'Full Stack', 'SDE Intern', 'AI Engineer', 'Marketing'];

  const categories = [
    { id: 'eng', name: 'Engineering', count: '5,420 jobs available', icon: Code2, color: 'text-stone-800' },
    { id: 'ai', name: 'AI & Machine Learning', count: '1,280 jobs available', icon: Cpu, color: 'text-stone-800' },
    { id: 'hr', name: 'Human Resource', count: '1,850 recruiter contacts', icon: Users, color: 'text-stone-800' },
    { id: 'sales', name: 'Sales & BD', count: '750 jobs available', icon: TrendingUp, color: 'text-stone-800' },
    { id: 'mkt', name: 'Marketing', count: '840 jobs available', icon: Megaphone, color: 'text-stone-800' },
    { id: 'fin', name: 'Finance & Quant', count: '620 jobs available', icon: Banknote, color: 'text-stone-800' },
    { id: 'design', name: 'Design & UX', count: '480 jobs available', icon: Palette, color: 'text-stone-800' },
    { id: 'remote', name: 'Remote Global', count: '5,800+ jobs available', icon: Globe, color: 'text-stone-800' },
  ];

  const filteredFeatured = featuredJobs.filter(job => {
    if (activeTab === 'today') return job.is_new_today || job.posted_date_text === 'Today';
    if (activeTab === 'remote') return job.is_remote;
    if (activeTab === 'intern') return (job.type || '').toLowerCase().includes('intern');
    return true;
  });

  return (
    <div className="space-y-24 pb-28 text-stone-900">
      
      {/* ── 1. HERO SECTION (JobHuntly Styled Layout) ────────────────────── */}
      <section className="relative pt-6 sm:pt-10 pb-6">
        
        {/* Subtle decorative background angles */}
        <div className="absolute top-0 right-0 w-[55%] h-full bg-[#FAF9F5]/70 rounded-3xl -z-10 hidden lg:block border border-[#F0EBE0]/60"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Subtitle, Search Card */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Live Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FAF9F5] text-stone-800 border border-[#EBE6DD]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>VERIFIED REAL-TIME TECH OPPORTUNITIES</span>
            </div>

            {/* Bold Hero Headline with Underline Accent */}
            <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]">
              Discover <br />
              more than <br />
              <span className="relative inline-block text-[#4640DE]">
                13,500+ Jobs
                {/* Hand-drawn style clean underline */}
                <svg className="absolute -bottom-2.5 left-0 w-full h-3 text-[#4640DE]" viewBox="0 0 260 12" fill="none" preserveAspectRatio="none">
                  <path d="M2 9C55 3 175 2 258 9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed pt-1">
              Great platform for the job seeker searching for new career heights, verified early tech drops, and direct recruiter inboxes across India and global remote startups.
            </p>

            {/* Prominent White & Cream Search Card */}
            <div className="bg-white rounded-2xl border border-[#E5E0D5] p-3 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
                
                {/* Keyword input */}
                <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 bg-[#FAF9F5] rounded-xl border border-[#EBE6DD] focus-within:border-stone-400 transition-colors">
                  <Search className="w-4 h-4 text-stone-400 shrink-0" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Job title or keyword"
                    className="w-full bg-transparent text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none font-medium"
                  />
                </div>

                {/* Location dropdown/input */}
                <div className="sm:w-44 flex items-center gap-2 px-3 py-2.5 bg-[#FAF9F5] rounded-xl border border-[#EBE6DD] focus-within:border-stone-400 transition-colors">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-stone-800 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="All">All Locations</option>
                    <option value="India">India (Hybrid / Onsite)</option>
                    <option value="Remote">100% Remote</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Global">US &amp; Global Tech</option>
                  </select>
                </div>

                {/* Submit CTA button (JobHuntly Indigo) */}
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-[#4640DE] hover:bg-[#3B35C8] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-[0.98]"
                >
                  <span>Search my job</span>
                </button>
              </form>

              {/* Popular tags row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-500">
                <span className="font-semibold text-stone-700">Popular :</span>
                {popularKeywords.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setKeyword(tag);
                      handleSearchSubmit();
                    }}
                    className="hover:text-stone-900 hover:underline cursor-pointer"
                  >
                    {tag},
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Hero Portrait of Professional Man */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Visual Container */}
            <div className="relative w-full max-w-md mx-auto">
              
              {/* Backing geometric layer */}
              <div className="absolute inset-0 bg-[#F4EFE6] rounded-3xl transform rotate-2 -z-10 border border-[#E8E1D2]"></div>

              {/* Main Photo Card */}
              <div className="relative bg-white rounded-3xl p-3 border border-[#E5E0D5] shadow-xl overflow-hidden">
                <img 
                  src="/hero-person.jpg" 
                  alt="Young Software Professional" 
                  className="w-full h-[400px] sm:h-[460px] object-cover object-top rounded-2xl"
                />

                {/* Overlay Floating Metric Card 1 (Top Right: HR Inboxes) */}
                <div className="absolute top-7 right-7 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#EBE6DD] shadow-lg flex items-center gap-2.5 animate-bounce-slow">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF9F5] text-[#4640DE] flex items-center justify-center font-bold border border-[#E0D9CB]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-stone-900 block leading-tight">
                      1,850+ HR Inboxes
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium block">
                      Direct corporate emails
                    </span>
                  </div>
                </div>

                {/* Overlay Floating Metric Card 2 (Bottom Left: 0-Hour SLA) */}
                <div className="absolute bottom-7 left-7 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#EBE6DD] shadow-lg flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-stone-900 block leading-tight">
                      5-Hour Freshness SLA
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium block">
                      Zero stale listings
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ── 2. TRUSTED BY HIRING COMPANIES STRIP ───────────────────────── */}
      <section className="py-6 border-y border-[#EBE6DD]">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest text-center mb-6">
          Companies hiring directly through JobOrbit
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all">
          <span className="text-lg font-black tracking-tight text-stone-800">TESLA</span>
          <span className="text-lg font-black tracking-tight text-stone-800">AMD</span>
          <span className="text-lg font-black tracking-tight text-stone-800">intel</span>
          <span className="text-lg font-black tracking-tight text-stone-800">Canonical</span>
          <span className="text-lg font-black tracking-tight text-stone-800">Talkit</span>
          <span className="text-lg font-black tracking-tight text-stone-800">Google</span>
          <span className="text-lg font-black tracking-tight text-stone-800">Rubrik</span>
          <span className="text-lg font-black tracking-tight text-stone-800">ZEPTO</span>
          <span className="text-lg font-black tracking-tight text-stone-800">SWIGGY</span>
        </div>
      </section>

      {/* ── 3. EXPLORE BY CATEGORY SECTION (Matches Image UI Kit) ────────── */}
      <section className="space-y-8 text-left">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Explore by <span className="text-[#4640DE]">category</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Curated streams covering engineering, autonomous AI, growth, and direct HR talent pools.
            </p>
          </div>

          <button
            onClick={onExploreJobs}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#4640DE] hover:text-[#3B35C8] group cursor-pointer shrink-0"
          >
            <span>Show all jobs</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 8 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className="bg-white hover:bg-[#FAF9F5] p-5 rounded-2xl border border-[#EBE6DD] hover:border-[#D6CEBF] transition-all cursor-pointer group shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 flex flex-col justify-between h-40"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] group-hover:bg-white text-stone-800 flex items-center justify-center border border-[#EBE6DD] transition-colors">
                  <Icon className="w-5 h-5 text-stone-700 group-hover:text-[#4640DE] transition-colors" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#4640DE] transition-colors">
                    {cat.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
                    <span>{cat.count}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* ── 4. FEATURED JOBS (Clean White and Cream Cards) ───────────────── */}
      <section id="jobs-section" className="space-y-8 text-left">
        
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Featured <span className="text-[#4640DE]">Job Openings</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Active engineering, AI/ML, and startup roles scraped directly from employer ATS portals.
            </p>
          </div>

          {/* Clean Neutral Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F5] rounded-xl border border-[#EBE6DD] overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'today', label: 'Added Today' },
              { id: 'remote', label: 'Remote Global' },
              { id: 'intern', label: 'Internships' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-stone-900 shadow-xs border border-[#E0D9CB] font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Job Cards Grid (White & Cream Theme) */}
        {loadingJobs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-44 rounded-2xl bg-[#FAF9F5] border border-[#EBE6DD] animate-pulse p-5"></div>
            ))}
          </div>
        ) : filteredFeatured.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#EBE6DD] space-y-3">
            <Briefcase className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-sm font-semibold text-stone-700">No active roles in this category right now.</p>
            <button
              onClick={() => setActiveTab('all')}
              className="text-xs font-bold text-[#4640DE] hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeatured.map((job) => (
              <div
                key={job.id}
                onClick={() => onOpenJob ? onOpenJob(job.id) : (window.location.hash = `job-${job.id}`)}
                className="bg-white hover:bg-[#FAF9F5] rounded-2xl border border-[#EBE6DD] hover:border-[#D6CEBF] p-5 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  {/* Header Row: Company Monogram & Details */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#EFE9DF] pb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#F4EFE6] text-stone-800 font-bold flex items-center justify-center text-xs shrink-0 border border-[#E4DEC8]">
                        {(job.company || 'C')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block truncate">
                          {job.company}
                        </span>
                        <span className="text-[11px] text-stone-400 font-medium block">
                          {job.posted_date_text || 'Active listing'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {job.is_vip_exclusive && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#F4EFE6] text-stone-800 border border-[#E0D8C5]">
                          VIP Exclusive
                        </span>
                      )}
                      {job.is_remote && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[#FAF7F0] text-stone-600 border border-[#EAE3D3]">
                          Remote
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-[#4640DE] transition-colors line-clamp-2 leading-snug">
                    {job.title}
                  </h3>

                  {/* Meta Chips in Cream/Stone */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {job.pay && (
                      <div className="font-semibold text-stone-800 bg-[#F5F0E6] px-2.5 py-1 rounded-md border border-[#E6DEC9]">
                        {job.pay}
                      </div>
                    )}
                    <div className="flex items-center gap-1 font-medium text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span className="truncate max-w-[140px]">{job.location}</span>
                    </div>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-500 font-medium">{job.type}</span>
                  </div>

                  {/* Snippet */}
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {job.snippet || job.description}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div 
                  className="mt-4 pt-3 border-t border-[#EFE9DF] flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onOpenJob ? onOpenJob(job.id) : (window.location.hash = `job-${job.id}`)}
                    className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[#4640DE] hover:bg-[#3B35C8] text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>View Role &amp; Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenJob ? onOpenJob(job.id) : (window.location.hash = `job-${job.id}`)}
                    className="py-2 px-3 text-xs font-semibold rounded-xl bg-white hover:bg-[#FAF9F5] text-stone-700 border border-[#DDD6C9] transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Jobs Bottom CTA */}
        <div className="text-center pt-4">
          <button
            onClick={onExploreJobs}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm group"
          >
            <span>Explore all {totalJobs.toLocaleString()}+ opportunities</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </section>

      {/* ── 5. COMMUNITY REVIEWS & FEEDBACK SECTION ──────────────────────── */}
      <section className="space-y-8 text-left bg-[#FAF9F5] p-6 sm:p-10 rounded-3xl border border-[#EBE6DD]">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 mb-2">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>4.9 / 5 Candidate Satisfaction</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Verified Candidate <span className="text-[#4640DE]">Reviews</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Read how developers, students, and engineers use JobOrbit's real-time drops and recruiter contacts.
            </p>
          </div>

          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#DDD6C9] text-stone-800 text-xs font-bold hover:bg-[#F5EFE4] transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Write a Review</span>
            </button>
          )}
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {communityReviews.slice(0, 3).map((rev) => (
            <div 
              key={rev.id} 
              className="bg-white p-5 rounded-2xl border border-[#EBE6DD] flex flex-col justify-between space-y-3 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed italic">
                  "{rev.text}"
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-stone-900 block">{rev.name}</span>
                  <span className="text-stone-500 block">{rev.role}</span>
                </div>
                <span className="text-stone-400 font-mono text-[10px]">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ── 6. AUTONOMOUS TOOLS QUICK BANNER ─────────────────────────────── */}
      <section className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 text-left relative overflow-hidden">
        
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Resume Studio &amp; Profile Audit</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
            Tailor Your Resume with AI in Seconds. <br />
            Match Real Job Descriptions with STAR Metrics.
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Generate ATS-compliant single-page LaTeX PDF resumes, detect keyword gaps, and unlock cold outreach recruiter emails.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenResume}
              className="px-5 py-2.5 rounded-xl bg-white text-stone-900 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Open AI Resume Studio
            </button>
            <button
              onClick={onOpenAudit}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors cursor-pointer"
            >
              Run Profile Audit
            </button>
            <button
              onClick={onOpenVIP}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Get VIP Pass (₹75)
            </button>
          </div>
        </div>

      </section>

    </div>
  );
}
