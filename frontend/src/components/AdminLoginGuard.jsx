import React, { useState } from 'react';
import { Shield, KeyRound, ArrowLeft, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginGuard({ onAuthenticated, onCancel }) {
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please provide the master admin secret token.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/stats', {
        headers: {
          'X-Admin-Token': token.trim()
        }
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        localStorage.setItem('joborbit_admin_token', token.trim());
        onAuthenticated(token.trim(), data);
      } else {
        setError(data.message || 'Invalid admin token. Access denied.');
      }
    } catch (err) {
      setError('Failed to contact authentication gateway. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDevKey = () => {
    setToken('joborbit-admin-secret-2026');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="bg-slate-950 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-blue-900/20 to-transparent pointer-events-none"></div>
          
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
            <Lock className="w-7 h-7 text-blue-400" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            Restricted Zone
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            System Administration
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            Crawler orchestration, database synchronization, and ingestion telemetry control.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerifyToken} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Master Admin Token</span>
                <span className="text-[11px] font-normal text-slate-400">Header: X-Admin-Token</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin secret..."
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick autofill helper for dev */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Local Dev Key:</span>
              <button
                type="button"
                onClick={handleUseDevKey}
                className="font-mono text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Use joborbit-admin-secret-2026
              </button>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Authenticating...</span>
                  </span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-blue-400" />
                    <span>Unlock Admin Console</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Site</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
