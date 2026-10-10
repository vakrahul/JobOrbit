import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  User, 
  LogOut,
  Bookmark,
  ExternalLink
} from 'lucide-react';

export default function Navbar({ 
  currentView, 
  setCurrentView,
  onOpenVIP,
  onOpenLegal,
  onOpenAuth,
  onOpenProfile,
  currentUser,
  onSignOut,
  totalJobs = 13538
}) {
  const [appliedCount, setAppliedCount] = useState(0);

  useEffect(() => {
    const count = parseInt(localStorage.getItem('joborbit_applied_count') || '0', 10);
    setAppliedCount(count);
  }, [currentUser]);

  // Clean, minimal primary links only (Hidden: AI Audit Agent, Research, AI Matcher)
  const navLinks = [
    { id: 'public', label: 'Find Jobs' },
    { id: 'hr', label: 'Companies & HR' },
    { id: 'resume', label: 'Resume Studio' }
  ];

  return (
    <header className="border-b border-[#EBE6DD] bg-white/95 backdrop-blur-md sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          
          {/* Left: Brand Logo & Minimal Active Badge */}
          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={() => setCurrentView('landing')} 
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#4640DE] text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:bg-[#3B35C8] transition-colors shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1 font-black text-lg text-stone-900 tracking-tight">
                <span>JobOrbit</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4640DE]"></span>
              </div>
            </button>

            {/* Subtle Active Count Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF9F5] text-stone-700 text-[11px] font-semibold border border-[#EBE6DD]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{totalJobs.toLocaleString()}+ Live Roles</span>
            </div>
          </div>

          {/* Center: Clean Modern Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setCurrentView(link.id)}
                  className={`text-sm font-medium transition-colors cursor-pointer py-1 relative ${
                    isActive
                      ? 'text-[#4640DE] font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#4640DE] rounded-full"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: User / Auth Actions */}
          <div className="flex items-center gap-3 shrink-0">
            
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Tracker Link */}
                <button
                  onClick={() => setCurrentView('tracker')}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    currentView === 'tracker'
                      ? 'bg-[#FAF9F5] border-stone-300 text-stone-900'
                      : 'bg-white border-[#EBE6DD] text-stone-600 hover:text-stone-900 hover:bg-[#FAF9F5]'
                  }`}
                  title="Application Tracker"
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                {/* Profile Button */}
                <button 
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF9F5] text-stone-800 text-xs font-bold border border-[#EBE6DD] hover:border-[#D6CEBF] transition-all cursor-pointer"
                  title="Open Candidate Profile"
                >
                  <span className="w-5 h-5 rounded-full bg-[#4640DE] text-white flex items-center justify-center text-[10px] shrink-0 font-black">
                    {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[100px] truncate text-stone-900 font-semibold">
                    {currentUser.name || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#EAE4D5] text-stone-700">
                    {appliedCount} applied
                  </span>
                </button>

                {/* Sign Out */}
                <button 
                  onClick={onSignOut}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth?.("login")}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth?.("signup")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#4640DE] hover:bg-[#3B35C8] shadow-xs transition-colors cursor-pointer"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile Minimal Navigation Strip */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#EBE6DD]">
          {navLinks.map((link) => {
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setCurrentView(link.id)}
                className={`text-xs font-semibold py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#4640DE] bg-[#FAF9F5]'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
