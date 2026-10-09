import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, AlertCircle, Clock, Database, RefreshCw } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('joborbit_admin_token') || '';
      const res = await fetch('/api/admin/logs?limit=40', {
        headers: {
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-5 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Crawler Sync Audit History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable execution trace ledger recorded by 3-hour cron and manual scraper runs
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium text-slate-500">Loading audit history...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-slate-200 p-8">
          <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No sync history recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1">Logs will appear here once the first pipeline run executes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Run ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Found / Ingested</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-100 text-slate-700 text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      #{log.id}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-sans text-xs">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-blue-600">
                      {log.source}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {log.duration_sec}s
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900">{log.jobs_found}</span>
                      <span className="text-slate-400 mx-1">found /</span>
                      <span className="text-emerald-600 font-bold">+{log.jobs_added}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {log.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>COMPLETED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>{log.status?.toUpperCase()}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-sans max-w-xs truncate text-xs">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
