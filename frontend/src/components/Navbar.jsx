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
  LogOut
} from 'lucide-react';

export default function Navbar({ 
  currentView, 
  setCurrentView,
  onOpenVIP,
  onOpenLegal,
  onOpenAuth,
  currentUser,
  onSignOut,
  totalJobs = 9725
}) {
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

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand Logo & Live Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setCurrentView('landing')} 
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-blue-700 transition-colors shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 font-extrabold text-base text-slate-900 tracking-tight leading-tight">
                  <span>JobOrbit</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 leading-tight">
                  Direct Ingestion
                </span>
              </div>
            </button>
            
            <div className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/60 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              <span>{totalJobs.toLocaleString()} Verified</span>
            </div>
          </div>

          {/* Center: Segmented Navigation Control Bar */}
          <nav className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 shadow-2xs shrink-0">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-blue-100 text-blue-700 tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions (VIP & Admin Switcher) */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Policy & Compliance Button */}
            {onOpenLegal && (
              <button
                onClick={() => onOpenLegal('terms')}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Career Policy, Terms & Security Shield"
              >
                <Scale className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Policies</span>
              </button>
            )}



            {/* Auth Sign In / User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/60">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">
                    {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {currentUser.name || currentUser.email?.split('@')[0]}
                  </span>
                </div>
                <button 
                  onClick={onSignOut}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile / Tablet Horizontal Scrollable Navigation */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
