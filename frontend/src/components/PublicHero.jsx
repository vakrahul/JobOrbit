import React from 'react';
import { Search, MapPin, Sparkles, Building2, Globe, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function PublicHero({ 
  search, 
  setSearch, 
  onSearchSubmit, 
  totalJobs = 9721, 
  indiaJobs = 3880,
  globalJobs = 5841,
  newToday = 192,
  onExploreClick,
  onVIPClick 
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs mb-8">
      <div className="max-w-4xl space-y-6">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>{totalJobs.toLocaleString()} Verified Jobs Ingested · Zero Redirects</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Find Your Next Tech Role <br className="hidden sm:inline" />
          <span className="text-blue-600">Without the Noise & Middlemen.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
          Aggregating verified software, AI/ML, and graduate opportunities from top companies across India and worldwide. Direct career links and verified HR recruiter contacts only.
        </p>

        {/* Search Bar */}
        <form onSubmit={onSearchSubmit} className="pt-2 flex flex-col sm:flex-row items-stretch gap-2.5 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, company, or skill (e.g. Python, Amazon, 2026)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Search Jobs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Metric Badges */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Verified Positions</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalJobs.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700 font-medium">⚡ Added Today</p>
            <p className="text-2xl font-bold text-amber-800 mt-0.5">
              +{newToday.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">India Listings</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {indiaJobs.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Global Tech</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {globalJobs.toLocaleString()}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
