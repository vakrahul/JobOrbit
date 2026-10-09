import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Terminal as TerminalIcon, 
  Globe, 
  MapPin, 
  Zap, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function PipelineConsole({ 
  stats, 
  syncState, 
  onTriggerSync, 
  schedulerStatus,
  onRefreshStats,
  onNavigateTab,
  adminToken
}) {
  const terminalRef = useRef(null);
  const [syncMode, setSyncMode] = useState('incremental');

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [syncState?.logs]);

  const isRunning = syncState?.is_running;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Telemetry Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Ingested */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Database</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-1">
            {stats?.stats?.total_jobs?.toLocaleString() || '13,259'}
          </div>
          <span className="text-xs text-slate-400">Verified Opportunities</span>
        </div>

        {/* Registered Users */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Platform Users</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-900 my-1 flex items-baseline gap-2">
            <span>{stats?.stats?.total_users || 1}</span>
            <span className="text-xs font-semibold text-blue-700">({stats?.stats?.premium_users || 1} VIP)</span>
          </div>
          <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Registered Accounts</span>
          </span>
        </div>

        {/* New Today */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Added Today</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 my-1">
            +{stats?.stats?.new_today?.toLocaleString() || '1,792'}
          </div>
          <span className="text-xs font-semibold text-amber-700">Early Access Window</span>
        </div>

        {/* HR Leads */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">HR Recruiter Leads</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-1">
            {stats?.stats?.total_hr?.toLocaleString() || '20'}
          </div>
          <span className="text-xs text-slate-400">Verified Corporate Inboxes</span>
        </div>

        {/* India Feed */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">India Feed</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-1">
            {stats?.stats?.india_jobs?.toLocaleString() || '4,479'}
          </div>
          <span className="text-xs text-slate-400">Domestic Openings</span>
        </div>

        {/* Global Feed */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Global / US</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-1">
            {stats?.stats?.global_jobs?.toLocaleString() || '8,780'}
          </div>
          <span className="text-xs text-slate-400">Tech &amp; Remote Roles</span>
        </div>

      </div>

      {/* Multi-Source Aggregator Telemetry Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Multi-Channel Ingestion Distribution:
            </span>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* LinkedIn */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>LinkedIn Verified: {stats?.stats?.source_counts?.linkedin || 13}</span>
              </div>

              {/* Internshala */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                <span>Internshala Tech: {stats?.stats?.source_counts?.internshala || 60}</span>
              </div>

              {/* Wellfound */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                <span>Wellfound Startups: {stats?.stats?.source_counts?.wellfound || 301}</span>
              </div>

              {/* Carrerlift / JobOrbit */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>JobOrbit Corporate: {stats?.stats?.source_counts?.carrerlift?.toLocaleString() || '12,957'}</span>
              </div>
            </div>
          </div>

          {onNavigateTab && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigateTab('linkedin')}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <span>Open LinkedIn Bot (20/run)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Sync Mode Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Active Crawl Mode:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              syncMode === 'incremental' 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'bg-slate-900 text-white'
            }`}>
              {syncMode === 'incremental' ? '⚡ Incremental Delta Sync (Fastest)' : '🔄 Full Archive Backfill'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {syncMode === 'incremental' 
              ? 'Starts from Page 1 (today\'s newly posted jobs) and automatically early-stops the instant existing listings are found (~3–5s).'
              : 'Crawls all 163–199 pages across India and Global feeds to rebuild the full historical archive.'}
          </p>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setSyncMode('incremental')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              syncMode === 'incremental'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ New Today (Delta)
          </button>
          <button
            onClick={() => setSyncMode('full')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              syncMode === 'full'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔄 Full Archive
          </button>
        </div>
      </div>

      {/* Execution Channel Triggers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Pipeline Trigger Channels
          </h2>
          {isRunning && (
            <div className="flex items-center gap-2 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>Running: {syncState?.target?.toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Action 1: India */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Channel 01</span>
              <h3 className="text-base font-bold text-slate-900">Sync India Jobs</h3>
              <p className="text-xs text-slate-500">
                {syncMode === 'incremental' ? 'Pulls new jobs added today and early-stops (~3s).' : 'Full 163-page crawl across ~3,894 listings.'}
              </p>
            </div>
            <button
              onClick={() => onTriggerSync('india', syncMode)}
              disabled={isRunning}
              className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>Sync India</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 2: Global */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Channel 02</span>
              <h3 className="text-base font-bold text-slate-900">Sync Global / US</h3>
              <p className="text-xs text-slate-500">
                {syncMode === 'incremental' ? 'Pulls international roles from page 1 and stops.' : 'Full 199-page crawl across ~5,955 global jobs.'}
              </p>
            </div>
            <button
              onClick={() => onTriggerSync('global', syncMode)}
              disabled={isRunning}
              className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>Sync Global</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 3: Complete Ingestion */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Channel 03 · All</span>
              <h3 className="text-base font-bold text-slate-900">Sync All Channels</h3>
              <p className="text-xs text-slate-600">
                {syncMode === 'incremental' ? 'Syncs new India + Global listings + HR leads in ~5-8s.' : 'Complete backfill of both feeds (~10,000 jobs).'}
              </p>
            </div>
            <button
              onClick={() => onTriggerSync('all', syncMode)}
              disabled={isRunning}
              className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>Launch Full Cycle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 4: Quick Test */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Test Run</span>
              <h3 className="text-base font-bold text-slate-900">Smoke Test (2 Pages)</h3>
              <p className="text-xs text-slate-500">
                Sample test crawl top 2 pages of India and Global feeds to verify connectivity.
              </p>
            </div>
            <button
              onClick={() => onTriggerSync('quick', 'incremental')}
              disabled={isRunning}
              className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>Test Connectivity</span>
              <Play className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Terminal Telemetry Console */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Ingestion Telemetry Terminal
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span>Status: <strong className={isRunning ? 'text-amber-600' : 'text-emerald-600'}>{syncState?.status?.toUpperCase()}</strong></span>
            {syncState?.current_page > 0 && (
              <span>Page: <strong>{syncState.current_page}</strong> / {syncState.total_pages}</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(5, syncState?.progress_percent || 0)}%` }}
            ></div>
          </div>
        )}

        {/* Modern Terminal Box */}
        <div className="bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-md">
          {/* Header */}
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="ml-2 text-slate-400">joborbit-pipeline-daemon.log</span>
            </div>
            <div className="text-[11px]">
              <span>Mode: <strong className="text-amber-400">{syncState?.mode?.toUpperCase() || syncMode.toUpperCase()}</strong></span>
              <span className="mx-2">•</span>
              <span>Target: <strong className="text-white">{syncState?.target?.toUpperCase() || 'IDLE'}</strong></span>
            </div>
          </div>

          {/* Logs Body */}
          <div 
            ref={terminalRef}
            className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-1 bg-slate-950"
          >
            {(!syncState?.logs || syncState.logs.length === 0) ? (
              <div className="text-slate-600 italic py-16 text-center">
                Terminal idle. Click any action button above to trigger sync and stream live progress.
              </div>
            ) : (
              syncState.logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-blue-400 select-none">&gt;</span>
                  <span className={
                    log.includes('Incremental Stop') ? 'text-amber-400 font-bold' :
                    log.includes('Error') || log.includes('failed') ? 'text-rose-400 font-semibold' :
                    log.includes('Ingested') || log.includes('completed') ? 'text-emerald-400 font-semibold' :
                    log.includes('Starting') || log.includes('Targeting') ? 'text-white font-bold' :
                    'text-slate-300'
                  }>
                    {log}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div>
              <span>Extracted: <strong className="text-white">{syncState?.jobs_extracted || 0}</strong></span>
              <span className="mx-2">|</span>
              <span>New: <strong className="text-emerald-400">+{syncState?.jobs_added || 0}</strong></span>
              <span className="mx-2">|</span>
              <span>Refreshed: <strong className="text-white">{syncState?.jobs_updated || 0}</strong></span>
            </div>
            {isRunning && (
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Streaming live telemetry...</span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
