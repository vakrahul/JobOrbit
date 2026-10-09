import React, { useState } from 'react';
import PipelineConsole from './PipelineConsole';
import JobsExplorer from './JobsExplorer';
import AdminJobsManager from './AdminJobsManager';
import LinkedInScraperRunner from './LinkedInScraperRunner';
import HRDirectory from './HRDirectory';
import AuditLogs from './AuditLogs';
import { Terminal, Database, Users, History, ArrowLeft, Shield, Sparkles, PlusCircle, Bot } from 'lucide-react';

export default function AdminPanel({
  stats,
  syncState,
  onTriggerSync,
  onRefreshStats,
  onExitAdmin,
  onSignOutAdmin,
  adminToken
}) {
  const [adminTab, setAdminTab] = useState('jobs');


  return (
    <div className="space-y-6 pb-16">
      
      {/* Admin OS Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Crawler Admin Engine
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-xs">APScheduler 3-Hour Background Cron Active</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pipeline Orchestration & Ingestion Telemetry
          </h1>

          <p className="text-xs text-slate-400 max-w-2xl">
            Managing {stats?.stats?.total_jobs?.toLocaleString() || '13,259'} verified database records across India & Global tech channels with incremental delta crawler early-stopping.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onSignOutAdmin && (
            <button
              onClick={onSignOutAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800/80 transition-colors cursor-pointer"
              title="Lock Admin and revoke session token"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Lock Admin</span>
            </button>
          )}

          <button
            onClick={onExitAdmin}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <button
          onClick={() => setAdminTab('console')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            adminTab === 'console'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>01 / Pipeline Console</span>
        </button>

        <button
          onClick={() => setAdminTab('jobs')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            adminTab === 'jobs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>02 / Job Management (CRUD: +Add / Edit / Delete)</span>
        </button>

        <button
          onClick={() => setAdminTab('linkedin')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            adminTab === 'linkedin'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bot className="w-4 h-4 text-blue-400" />
          <span>03 / LinkedIn &amp; Source Harvester (20/run)</span>
        </button>

        <button
          onClick={() => setAdminTab('hr')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            adminTab === 'hr'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>04 / Recruiter Leads ({stats?.stats?.total_hr || 20})</span>
        </button>

        <button
          onClick={() => setAdminTab('logs')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            adminTab === 'logs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>05 / Crawler Audit History</span>
        </button>
      </div>

      {/* Admin Tab View */}
      <div>
        {adminTab === 'console' && (
          <PipelineConsole
            stats={stats}
            syncState={syncState}
            onTriggerSync={onTriggerSync}
            schedulerStatus={stats?.scheduler}
            onRefreshStats={onRefreshStats}
            onNavigateTab={setAdminTab}
            adminToken={adminToken}
          />
        )}

        {adminTab === 'jobs' && (
          <AdminJobsManager adminToken={adminToken} />
        )}

        {adminTab === 'linkedin' && (
          <LinkedInScraperRunner adminToken={adminToken} onRefreshStats={onRefreshStats} />
        )}

        {adminTab === 'hr' && (
          <HRDirectory />
        )}

        {adminTab === 'logs' && (
          <AuditLogs />
        )}
      </div>

    </div>
  );
}

