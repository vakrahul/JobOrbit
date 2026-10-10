import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  User, 
  LogOut,
  Bookmark,
  ExternalLink,
  Sparkles,
  ShieldCheck
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

  const isPremium = Boolean(currentUser?.is_premium);

  // Clean, minimal primary links only
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
              <div className="flex items-center gap-2.5">
                
                {/* Clear Membership Label: VIP vs Free */}
                {isPremium ? (
                  <button
                    onClick={onOpenVIP}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer"
                    title="VIP Membership Active - Early Drops & Recruiter Contacts Unlocked"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>VIP Member</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-600 text-[11px] font-semibold"
                      title="Free Candidate Plan"
                    >
                      Free Plan
                    </span>
                    <button
                      onClick={onOpenVIP}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      title="Unlock Early Drops & Direct Recruiter Emails for ₹75/mo"
                    >
                      <Sparkles className="w-3 h-3 fill-white" />
                      <span>Upgrade VIP</span>
                    </button>
                  </div>
                )}

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
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-black ${
                    isPremium ? 'bg-amber-500 text-white' : 'bg-[#4640DE] text-white'
                  }`}>
                    {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[100px] truncate text-stone-900 font-semibold">
                    {currentUser.name || currentUser.email?.split('@')[0]}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    isPremium ? 'bg-amber-100 text-amber-800' : 'bg-[#EAE4D5] text-stone-700'
                  }`}>
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
                  onClick={onOpenVIP}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>VIP Access</span>
                </button>
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
