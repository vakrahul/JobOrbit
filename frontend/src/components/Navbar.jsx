import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Shield, 
  ArrowLeft, 
  Sparkles, 
  GraduationCap, 
  Users, 
  Terminal, 
  Bookmark, 
  Target,
  FileText,
  Home,
  Scale,
  User,
  LogOut,
  ArrowRight
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

  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'public', label: 'Explore Jobs', icon: Briefcase },
    { id: 'resume', label: 'Resume Studio', icon: FileText },
    { id: 'audit', label: 'Audit Agent', icon: Sparkles },
    { id: 'research', label: 'Research', icon: GraduationCap },
    { id: 'hr', label: 'HR Directory', icon: Users },
    { id: 'match', label: 'AI Matcher', icon: Target },
    { id: 'tracker', label: 'Tracker', icon: Bookmark },
  ];

  const isLanding = currentView === 'landing' || currentView === 'home';

  return (
    <header className="border-b border-[#EBE6DD] bg-white/95 backdrop-blur-md sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand Logo & Live Active Participation Badge */}
          <div className="flex items-center gap-3.5 shrink-0">
            <button 
              onClick={() => setCurrentView('landing')} 
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#4640DE] text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:bg-[#3B35C8] transition-colors shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 font-black text-base text-stone-900 tracking-tight leading-tight">
                  <span>JobOrbit</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4640DE]"></span>
                </div>
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider leading-tight">
                  Direct Ingestion
                </span>
              </div>
            </button>
            
            {/* Active Participation Badge (Shown on landing page and throughout) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F5] text-stone-800 text-xs font-semibold border border-[#EBE6DD] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold">{totalJobs.toLocaleString()}+ Active Roles</span>
              <span className="text-stone-300 hidden sm:inline">•</span>
              <span className="text-stone-500 font-medium hidden sm:inline">1,850+ HR Inboxes</span>
            </div>
          </div>

          {/* Center: Segmented Navigation Control Bar (HIDDEN on Landing Page per User Request) */}
          {!isLanding && (
            <nav className="hidden md:flex items-center bg-[#FAF9F5] p-1 rounded-xl border border-[#EBE6DD] shadow-2xs shrink-0">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white text-stone-900 font-bold shadow-xs border border-[#E0D9CB]'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/60 font-medium'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#4640DE]' : 'text-stone-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* If on Landing Page: Clean Explore Jobs Button */}
            {isLanding && (
              <button
                onClick={() => setCurrentView('public')}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-[#FAF9F5] border border-transparent hover:border-[#EBE6DD] transition-all cursor-pointer"
              >
                <span>Find Jobs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Compliance / Policies */}
            {onOpenLegal && !isLanding && (
              <button
                onClick={() => onOpenLegal('terms')}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 text-stone-600 hover:text-stone-900 hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                title="Career Policy, Terms & Security Shield"
              >
                <Scale className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>Policies</span>
              </button>
            )}

            {/* User Profile / Auth Actions */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF9F5] text-stone-800 text-xs font-bold border border-[#EBE6DD] hover:border-[#D6CEBF] transition-all cursor-pointer"
                  title="Open Candidate Profile & Dashboard"
                >
                  <span className="w-5 h-5 rounded-full bg-[#4640DE] text-white flex items-center justify-center text-[10px] shrink-0 font-black">
                    {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[110px] truncate text-stone-900">
                    {currentUser.name || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#EAE4D5] text-stone-700">
                    {appliedCount} applied
                  </span>
                </button>
                <button 
                  onClick={onSignOut}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth?.("login")}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-[#FAF9F5] border border-[#EBE6DD] transition-colors cursor-pointer shrink-0"
                >
                  Log in
                </button>
                <button
                  onClick={() => onOpenAuth?.("signup")}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#4640DE] hover:bg-[#3B35C8] shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile Subnavigation (Only when NOT on landing page) */}
        {!isLanding && (
          <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-stone-100 scrollbar-none">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
}
