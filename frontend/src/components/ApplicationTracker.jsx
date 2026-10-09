import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  ExternalLink, 
  Trash2, 
  Plus, 
  ArrowRight,
  Briefcase,
  Building2,
  MapPin,
  Calendar
} from 'lucide-react';

export default function ApplicationTracker({ onOpenJob, onExploreJobs }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTracked = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tracker');
      const data = await res.json();
      if (data.status === 'success') {
        setItems(data.items || []);
      }
    } catch (e) {
      console.error("Tracker fetch error:", e);
      // Fallback to localStorage if offline
      const local = JSON.parse(localStorage.getItem('joborbit_saved_jobs') || '[]');
      setItems(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracked();
  }, []);

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      const res = await fetch('/api/tracker/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, status: newStatus })
      });
      if (res.ok) {
        setItems(prev => prev.map(item => item.job_id === jobId ? { ...item, status: newStatus } : item));
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  const handleRemove = async (jobId) => {
    try {
      const res = await fetch(`/api/tracker/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.job_id !== jobId));
      }
    } catch (e) {
      console.error("Failed to delete tracked job:", e);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const counts = {
    all: items.length,
    saved: items.filter(i => i.status === 'saved').length,
    applied: items.filter(i => i.status === 'applied').length,
    interviewing: items.filter(i => i.status === 'interviewing').length,
    offered: items.filter(i => i.status === 'offered').length
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Job Search CRM & Pipeline</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Application & Shortlist Tracker
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            Manage your opportunities across every stage. Track your bookmarked listings, active submissions, interviews in progress, and received offers with zero loss of context.
          </p>
        </div>
      </div>

      {/* Stage Metrics Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'all', label: 'All Tracked', count: counts.all, icon: Briefcase },
          { key: 'saved', label: 'Saved / Review', count: counts.saved, icon: Bookmark },
          { key: 'applied', label: 'Applied', count: counts.applied, icon: CheckCircle2 },
          { key: 'interviewing', label: 'Interviewing', count: counts.interviewing, icon: Clock },
          { key: 'offered', label: 'Offers', count: counts.offered, icon: Trophy }
        ].map(stage => {
          const Icon = stage.icon;
          const isActive = filter === stage.key;
          return (
            <button
              key={stage.key}
              onClick={() => setFilter(stage.key)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`text-xs font-bold ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                  {stage.label}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <span className="text-2xl font-black tracking-tight">
                {stage.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tracked Job Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse space-y-3">
              <div className="h-5 w-1/3 bg-slate-100 rounded"></div>
              <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">No applications in this category</h3>
            <p className="text-xs text-slate-500 mt-1">
              Explore 9,700+ verified listings and bookmark your favorites to track them here.
            </p>
          </div>
          <button
            onClick={onExploreJobs}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>Explore Jobs Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => {
            const job = item.job || {};
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
              >
                {/* Left Role Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      <span>{job.company || 'Company'}</span>
                    </span>
                    {job.location && (
                      <span className="text-xs text-slate-500 font-medium">
                        📍 {job.location}
                      </span>
                    )}
                    {job.pay && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {job.pay}
                      </span>
                    )}
                  </div>

                  <h3 
                    onClick={() => onOpenJob(job.id)}
                    className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {job.title || 'Untitled Opportunity'}
                  </h3>

                  {item.notes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Right Stage Controls */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  
                  {/* Status Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Stage
                    </label>
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.job_id, e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offered">Offer Received</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 md:pt-0">
                    {job.apply_url && (
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>Apply</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <button
                      onClick={() => handleRemove(item.job_id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove from tracker"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
