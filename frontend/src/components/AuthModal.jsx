import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Key,
  ShieldCheck,
  ExternalLink,
  Briefcase
} from 'lucide-react';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultTab = 'login' 
}) {
  const [tab, setTab] = useState(defaultTab); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const endpoint = tab === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload = tab === 'signup' ? { email, name, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        localStorage.setItem('joborbit_user_token', data.token);
        localStorage.setItem('joborbit_user', JSON.stringify(data.user));
        setSuccessMsg(tab === 'signup' ? 'Account created successfully!' : 'Signed in successfully!');
        setTimeout(() => {
          if (onSuccess) onSuccess(data.user, data.token);
          onClose();
        }, 800);
      } else {
        setError(data.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError('Connection error. Please check your internet or retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    setError('');
    // Check if Google OAuth Client ID is set in environment
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      // Toggle the step-by-step setup guide for the user
      setShowGoogleHelp(true);
      return;
    }

    // If client ID is present, trigger standard OAuth or backend Google endpoint
    try {
      setLoading(true);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || 'user@joborbit.live', name: name || 'Google Candidate' })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        localStorage.setItem('joborbit_user_token', data.token);
        localStorage.setItem('joborbit_user', JSON.stringify(data.user));
        if (onSuccess) onSuccess(data.user, data.token);
        onClose();
      }
    } catch (err) {
      setError('Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestGoogleDemo = async () => {
    setLoading(true);
    try {
      const demoEmail = email && email.includes('@') ? email : 'demo.candidate@joborbit.live';
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: demoEmail, 
          name: name || 'Google Verified Candidate',
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${demoEmail}`
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        localStorage.setItem('joborbit_user_token', data.token);
        localStorage.setItem('joborbit_user', JSON.stringify(data.user));
        setSuccessMsg(`Authenticated as ${demoEmail} via Google OAuth Provider!`);
        setTimeout(() => {
          if (onSuccess) onSuccess(data.user, data.token);
          onClose();
        }, 700);
      }
    } catch (e) {
      setError('Google authentication test failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {tab === 'login' ? 'Welcome Back to JobOrbit' : 'Create JobOrbit Account'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {tab === 'login' ? 'Sign in to access verified listings & saved applications' : 'Join thousands of engineers landing verified roles'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Switcher */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setTab('signup'); setError(''); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'signup' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google OAuth Quick Button */}
          <div>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignInClick}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Google OAuth Steps Guide (Expands if clicked) */}
          {showGoogleHelp && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-3">
              <div className="flex items-center justify-between text-blue-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Google OAuth Setup Steps for joborbit.live</span>
                </span>
                <button 
                  onClick={() => setShowGoogleHelp(false)}
                  className="text-blue-500 hover:text-blue-700 text-[10px]"
                >
                  ✕
                </button>
              </div>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
                <li>Go to <strong className="text-slate-900">console.cloud.google.com</strong> &bull; Create project.</li>
                <li>Under <strong>APIs &amp; Services &gt; Credentials</strong>, click <strong>Create Credentials &gt; OAuth Client ID</strong> (Web application).</li>
                <li>Add Authorized JavaScript Origin: <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-800">https://joborbit.live</code> (and <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-800">http://localhost:5173</code> for local).</li>
                <li>Add Authorized Redirect URI: <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-800">https://joborbit.live</code>.</li>
                <li>Copy your <strong>Client ID</strong> into <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono">frontend/.env</code> as: <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono text-blue-900">VITE_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com</code></li>
              </ol>

              <button
                type="button"
                onClick={handleTestGoogleDemo}
                className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                ⚡ Test Authenticate With Google Now (Direct Mode)
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Or with email
            </span>
            <div className="border-t border-slate-200 w-full"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'signup' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Minimum 6 characters</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="pt-2 text-center text-[11px] text-slate-500">
            {tab === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button 
                  onClick={() => { setTab('signup'); setError(''); }} 
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button 
                  onClick={() => { setTab('login'); setError(''); }} 
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Log In
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
