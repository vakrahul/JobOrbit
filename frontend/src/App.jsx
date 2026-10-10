import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MarqueeTicker from './components/MarqueeTicker';
import MainPage from './components/MainPage';
import JobDetailPage from './components/JobDetailPage';
import ResearchDirectory from './components/ResearchDirectory';
import HRDirectory from './components/HRDirectory';
import ResumeMatcher from './components/ResumeMatcher';
import ApplicationTracker from './components/ApplicationTracker';
import AdminPanel from './components/AdminPanel';
import AdminLoginGuard from './components/AdminLoginGuard';
import VIPModal from './components/VIPModal';
import VIPPage from './components/VIPPage';
import ResumeStudio from './components/ResumeStudio';
import LandingPage from './components/LandingPage';
import TermsPolicyModal from './components/TermsPolicyModal';
import AuditAgent from './components/AuditAgent';
import ErrorBoundary from './components/ErrorBoundary';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import ApplicationReviewModal from './components/ApplicationReviewModal';
import ConnectChatGPTModal from './components/ConnectChatGPTModal';

export default function App() {
  const getInitialView = () => {
    const path = window.location.pathname || '';
    const hash = window.location.hash || '';

    // 1. Path-based matching (e.g. /apply/1643, /job/1643, /jobs/1643)
    const pathJobMatch = path.match(/^\/(?:apply|job|jobs)\/(\d+)/i);
    if (pathJobMatch) return { view: 'job-detail', jobId: pathJobMatch[1] };
    if (path === '/admin') return { view: 'admin', jobId: null };
    if (path === '/resume') return { view: 'resume', jobId: null };
    if (path === '/audit' || path === '/audit-agent') return { view: 'audit', jobId: null };
    if (path === '/research') return { view: 'research', jobId: null };
    if (path === '/hr') return { view: 'hr', jobId: null };
    if (path === '/match') return { view: 'match', jobId: null };
    if (path === '/tracker') return { view: 'tracker', jobId: null };
    if (path === '/vip' || path === '/premium') return { view: 'vip', jobId: null };
    if (path === '/explore' || path === '/jobs') return { view: 'public', jobId: null };
    if (path === '/home' || path === '/landing') return { view: 'landing', jobId: null };

    // 2. Hash-based matching (e.g. #job-1643, #apply/1643, #vip)
    const hashJobMatch = hash.match(/^#(?:job|apply)[-/](\d+)/i);
    if (hashJobMatch) return { view: 'job-detail', jobId: hashJobMatch[1] };
    if (hash === '#admin') return { view: 'admin', jobId: null };
    if (hash === '#resume') return { view: 'resume', jobId: null };
    if (hash === '#audit' || hash === '#audit-agent') return { view: 'audit', jobId: null };
    if (hash === '#research') return { view: 'research', jobId: null };
    if (hash === '#hr') return { view: 'hr', jobId: null };
    if (hash === '#match') return { view: 'match', jobId: null };
    if (hash === '#tracker') return { view: 'tracker', jobId: null };
    if (hash === '#vip' || hash === '#premium') return { view: 'vip', jobId: null };
    if (hash === '#explore' || hash === '#jobs') return { view: 'public', jobId: null };
    if (hash === '#home' || hash === '#landing') return { view: 'landing', jobId: null };

    return { view: 'landing', jobId: null };
  };

  const [routeState, setRouteState] = useState(getInitialView);
  const currentView = routeState.view;
  const selectedJobId = routeState.jobId;

  const [stats, setStats] = useState(() => {
    try {
      const cached = localStorage.getItem('joborbit_cached_stats');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [syncState, setSyncState] = useState(null);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('terms');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('joborbit_admin_token') || '');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [chatGptModalOpen, setChatGptModalOpen] = useState(false);
  const [reviewModalToken, setReviewModalToken] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('token') || null;
    } catch {
      return null;
    }
  });
  const [authPromptMessage, setAuthPromptMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('joborbit_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleOpenAuth = (msg = '') => {
    setAuthPromptMessage(msg);
    setAuthModalOpen(true);
  };

  const handleSignOut = () => {
    localStorage.removeItem('joborbit_user_token');
    localStorage.removeItem('joborbit_user');
    localStorage.removeItem('joborbit_is_vip');
    setCurrentUser(null);
  };

  // Synchronize VIP status strictly with authenticated user's is_premium field
  useEffect(() => {
    if (currentUser) {
      if (currentUser.is_premium) {
        localStorage.setItem('joborbit_is_vip', 'true');
      } else {
        localStorage.removeItem('joborbit_is_vip');
      }
    } else {
      localStorage.removeItem('joborbit_is_vip');
    }
  }, [currentUser]);

  // Refresh user profile from backend on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('joborbit_user_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('joborbit_user', JSON.stringify(data.user));
          if (data.user.is_premium) {
            localStorage.setItem('joborbit_is_vip', 'true');
          } else {
            localStorage.removeItem('joborbit_is_vip');
          }
        }
      })
      .catch(err => console.warn("Failed to refresh user profile:", err));
    } else {
      localStorage.removeItem('joborbit_is_vip');
    }
  }, []);

  // Sync hash and pathname with view state
  useEffect(() => {
    const handleRouteSync = () => {
      setRouteState(getInitialView());
    };
    window.addEventListener('hashchange', handleRouteSync);
    window.addEventListener('popstate', handleRouteSync);
    return () => {
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('popstate', handleRouteSync);
    };
  }, []);

  // Catch Google OAuth redirect token from window.location.hash
  useEffect(() => {
    const handleGoogleHashToken = async () => {
      const hash = window.location.hash || '';
      if (hash.includes('access_token=')) {
        try {
          const params = new URLSearchParams(hash.replace(/^#/, ''));
          const accessToken = params.get('access_token');
          if (accessToken) {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const userInfo = await userInfoRes.json();
            if (userInfo && userInfo.email) {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: userInfo.email,
                  name: userInfo.name || userInfo.email.split('@')[0],
                  avatar_url: userInfo.picture
                })
              });
              const data = await res.json();
              if (res.ok && data.status === 'success') {
                localStorage.setItem('joborbit_user_token', data.token);
                localStorage.setItem('joborbit_user', JSON.stringify(data.user));
                setCurrentUser(data.user);
              }
            }
          }
        } catch (err) {
          console.error("Google OAuth token redirect handling error:", err);
        } finally {
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname || '/');
          } else {
            window.location.hash = '';
          }
        }
      }
    };

    handleGoogleHashToken();
  }, []);

  const handleOpenLegal = (tab = 'terms') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  const handleSetView = (view, jobId = null) => {
    if (view === 'admin') {
      window.location.hash = 'admin';
    } else if (view === 'resume') {
      window.location.hash = 'resume';
    } else if (view === 'audit' || view === 'audit-agent') {
      window.location.hash = 'audit';
    } else if (view === 'research') {
      window.location.hash = 'research';
    } else if (view === 'hr') {
      window.location.hash = 'hr';
    } else if (view === 'match') {
      window.location.hash = 'match';
    } else if (view === 'tracker') {
      window.location.hash = 'tracker';
    } else if (view === 'vip' || view === 'premium') {
      window.location.hash = 'vip';
    } else if (view === 'public' || view === 'explore' || view === 'jobs') {
      window.location.hash = 'explore';
    } else if (view === 'landing' || view === 'home') {
      if (window.location.pathname !== '/' && window.location.pathname !== '') {
        window.history.pushState(null, '', '/#home');
      }
      window.location.hash = 'home';
    } else if (view === 'job-detail' && jobId) {
      window.location.hash = `job-${jobId}`;
    } else {
      window.location.hash = '';
    }
  };

  // Fetch admin telemetry stats
  const fetchStats = async (overrideToken) => {
    const token = overrideToken || adminToken || localStorage.getItem('joborbit_admin_token');
    try {
      const headers = {};
      if (token) {
        headers['X-Admin-Token'] = token;
      }
      const res = await fetch('/api/admin/stats', { headers });
      const data = await res.json();
      if (data.status === 'success') {
        setStats(data);
        try {
          localStorage.setItem('joborbit_cached_stats', JSON.stringify(data));
        } catch {}
      }
    } catch (e) {
      console.error("Failed to fetch admin stats:", e);
    }
  };

  // Poll live sync telemetry
  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/admin/sync/status');
      const data = await res.json();
      setSyncState(data);
      
      // If sync just completed, refresh stats
      if (!data.is_running && syncState?.is_running) {
        fetchStats();
      }
    } catch (e) {
      console.error("Failed to fetch sync status:", e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSyncStatus();

    // Only set up recurring interval if in admin view or sync is actively executing
    if (currentView === 'admin' || syncState?.is_running) {
      const interval = setInterval(() => {
        fetchSyncStatus();
      }, syncState?.is_running ? 1500 : 8000);
      return () => clearInterval(interval);
    }
  }, [syncState?.is_running, adminToken, currentView]);

  // Trigger sync routine
  const handleTriggerSync = async (target, mode = 'incremental', pages = null) => {
    const token = adminToken || localStorage.getItem('joborbit_admin_token');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['X-Admin-Token'] = token;
      }
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ target, mode, pages })
      });
      const data = await res.json();
      if (res.ok) {
        fetchSyncStatus();
      } else {
        alert(data.message || "Failed to launch pipeline");
      }
    } catch (e) {
      console.error("Trigger sync error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Modern Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={handleSetView}
        onOpenVIP={() => setVipModalOpen(true)}
        onOpenLegal={handleOpenLegal}
        onOpenAuth={(mode) => handleOpenAuth(mode === 'signup' ? 'Sign up to access verified applications' : '')}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenChatGPT={() => setChatGptModalOpen(true)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        totalJobs={stats?.stats?.total_jobs || 13538}
      />

      {/* Modern Marquee Strip */}
      <MarqueeTicker />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 print:p-0 print:m-0 print:max-w-none">
        
        <ErrorBoundary key={currentView} onReset={() => handleSetView('landing')}>
          {/* VIEW ROUTER */}
          {currentView === 'landing' ? (
            <LandingPage
              stats={stats}
              onExploreJobs={() => handleSetView('public')}
              onOpenResume={() => handleSetView('resume')}
              onOpenAudit={() => handleSetView('audit')}
              onOpenVIP={() => handleSetView('vip')}
              onOpenLegal={handleOpenLegal}
              onOpenProfile={() => setProfileModalOpen(true)}
              onOpenChatGPT={() => setChatGptModalOpen(true)}
              onOpenJob={(id) => handleSetView('job-detail', id)}
            />
        ) : currentView === 'job-detail' && selectedJobId ? (
          <JobDetailPage
            jobId={selectedJobId}
            onBack={() => handleSetView('public')}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onOpenVIP={() => setVipModalOpen(true)}
          />
        ) : currentView === 'resume' ? (
          <ResumeStudio />
        ) : currentView === 'audit' ? (
          <AuditAgent onGoToResume={() => handleSetView('resume')} />
        ) : currentView === 'research' ? (
          <ResearchDirectory
            onDraftEmail={() => {}}
          />
        ) : currentView === 'hr' ? (
          <HRDirectory
            onOpenVIP={() => setVipModalOpen(true)}
            currentUser={currentUser}
          />
        ) : currentView === 'match' ? (
          <ResumeMatcher
            onOpenJob={(id) => handleSetView('job-detail', id)}
          />
        ) : currentView === 'tracker' ? (
          <ApplicationTracker
            onOpenJob={(id) => handleSetView('job-detail', id)}
            onExploreJobs={() => handleSetView('public')}
          />
        ) : currentView === 'vip' ? (
          <VIPPage
            onBackToJobs={() => handleSetView('public')}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
          />
        ) : currentView === 'admin' ? (
          !adminToken ? (
            <AdminLoginGuard
              onAuthenticated={(token, statsData) => {
                setAdminToken(token);
                if (statsData) setStats(statsData);
                else fetchStats(token);
              }}
              onCancel={() => handleSetView('landing')}
            />
          ) : (
            <AdminPanel
              stats={stats}
              syncState={syncState}
              onTriggerSync={handleTriggerSync}
              onRefreshStats={() => fetchStats(adminToken)}
              onExitAdmin={() => handleSetView('landing')}
              adminToken={adminToken}
              onSignOutAdmin={() => {
                localStorage.removeItem('joborbit_admin_token');
                setAdminToken('');
                handleSetView('landing');
              }}
            />
          )
        ) : (
          <MainPage
            onGoToAdmin={() => handleSetView('admin')}
            onOpenJob={(id) => handleSetView('job-detail', id)}
            onOpenVIP={() => setVipModalOpen(true)}
            onOpenAuth={handleOpenAuth}
            currentUser={currentUser}
            stats={stats}
          />
        )}
        </ErrorBoundary>

      </main>

      {/* Modern Clean Footer with Legal & Career Policies */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 mt-16 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          
          {/* Main Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-stone-600">
            <button onClick={() => handleSetView('landing')} className="hover:text-stone-900 cursor-pointer">
              Home
            </button>
            <button onClick={() => handleSetView('public')} className="hover:text-stone-900 cursor-pointer">
              Find Jobs ({stats?.stats?.total_jobs?.toLocaleString() || '13,538'})
            </button>
            <button onClick={() => handleSetView('hr')} className="hover:text-stone-900 cursor-pointer">
              Companies &amp; HR Inboxes
            </button>
            <button onClick={() => handleSetView('resume')} className="hover:text-stone-900 cursor-pointer">
              Resume Studio
            </button>
            <button onClick={() => handleSetView('tracker')} className="hover:text-stone-900 cursor-pointer">
              Application Tracker
            </button>
            <button onClick={() => handleSetView('vip')} className="text-amber-800 font-bold hover:underline cursor-pointer">
              VIP Pass (₹75)
            </button>
          </div>

          {/* Legal Compliance & Policies Row */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <button onClick={() => handleOpenLegal('terms')} className="hover:text-slate-900 underline underline-offset-2 cursor-pointer">
              Terms of Service
            </button>
            <span>•</span>
            <button onClick={() => handleOpenLegal('privacy')} className="hover:text-slate-900 underline underline-offset-2 cursor-pointer">
              Privacy &amp; Data Shield
            </button>
            <span>•</span>
            <button onClick={() => handleOpenLegal('career')} className="hover:text-slate-900 underline underline-offset-2 cursor-pointer">
              Career Compilation Policy
            </button>
            <span>•</span>
            <button onClick={() => handleOpenLegal('security')} className="hover:text-slate-900 underline underline-offset-2 cursor-pointer">
              Zero Secret / Cookie Exposure System
            </button>
            <span>•</span>
            <span className="font-semibold text-slate-700">All Rights Reserved © 2026 JobOrbit Inc.</span>
          </div>

          {/* Bottom Telemetry & Status Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-700">Enterprise Career Harvester Engine</span>
              <span>•</span>
              <span>Direct ATS Portals &bull; ₹75/mo VIP Access</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Verified Ingestion: <strong className="text-slate-800">{stats?.stats?.total_jobs?.toLocaleString() || '13,259'} Live Roles</strong></span>
              {currentView === 'admin' && (
                <>
                  <span>•</span>
                  <button
                    onClick={() => handleSetView('landing')}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    ← Exit Admin
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Global VIP Early Access Modal */}
      <VIPModal
        isOpen={vipModalOpen}
        onClose={() => setVipModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onActivateSuccess={(updatedUser, tier) => {
          if (updatedUser) {
            setCurrentUser(updatedUser);
            localStorage.setItem('joborbit_user', JSON.stringify(updatedUser));
          } else if (currentUser) {
            const up = { ...currentUser, is_premium: true, premium_tier: tier || 'monthly' };
            setCurrentUser(up);
            localStorage.setItem('joborbit_user', JSON.stringify(up));
          }
          localStorage.setItem('joborbit_is_vip', 'true');
        }}
      />

      {/* Global Terms, Career Policy & Security Shield Modal */}
      <TermsPolicyModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Global Authentication Modal (Login / Sign Up / Google OAuth) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthPromptMessage('');
        }}
        promptMessage={authPromptMessage}
        onSuccess={(user) => setCurrentUser(user)}
      />

      {/* Candidate Profile & Feedback Dashboard Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onOpenVIP={() => setVipModalOpen(true)}
        onNavigateToTracker={() => handleSetView('tracker')}
      />

      {/* Connect ChatGPT & Built-in Gemini AI Modal */}
      <ConnectChatGPTModal
        isOpen={chatGptModalOpen}
        onClose={() => setChatGptModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={(msg) => handleOpenAuth(msg)}
        onNavigateToStudio={() => handleSetView('resume')}
      />

      {/* Mandatory Human Approval Modal for ChatGPT & Portal Submissions */}
      {reviewModalToken && (
        <ApplicationReviewModal
          approvalToken={reviewModalToken}
          onClose={() => setReviewModalToken(null)}
          onActionSuccess={(data) => {
            console.log("Approval status updated:", data);
          }}
        />
      )}


    </div>
  );
}
