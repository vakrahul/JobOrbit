import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Target, 
  Briefcase, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ExternalLink, 
  Mail,
  RotateCcw,
  Building2,
  MapPin
} from 'lucide-react';

const SAMPLE_RESUME = `Software Engineer & AI Enthusiast with 1+ years experience building production web applications and ML pipelines.
Skills: Python, TypeScript, React, Next.js, Node.js, FastAPI, PyTorch, LangChain, RAG architectures, PostgreSQL, Redis, Docker, Git.
Projects:
- Built an autonomous multi-agent customer support workflow using LangChain and vector embeddings with FAISS.
- Designed high-throughput REST APIs handling 5,000+ requests/sec using FastAPI and Redis caching.
- Developed real-time dashboard in React with TailwindCSS and WebSocket state management.`;

export default function ResumeMatcher({ onOpenJob }) {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME);
  const [target, setTarget] = useState('jobs'); // 'jobs' | 'research' | 'hr'
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState(null);

  const handleMatch = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/match-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          target: target,
          limit: 12
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMatchData(data);
      }
    } catch (e) {
      console.error("Match error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Resume Matcher & Score Analyzer</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Match Your Resume with High-Yield Opportunities
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            Paste your resume or CV text to instantly calculate fit scores, detect matched skills, uncover missing keywords, and rank verified jobs, research labs, or recruiter leads.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Target Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            1. Select Match Target
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTarget('jobs')}
              className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                target === 'jobs'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2 rounded-lg ${target === 'jobs' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Open Jobs & Internships</p>
                <p className="text-[11px] text-slate-500">9,700+ tech roles</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTarget('research')}
              className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                target === 'research'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2 rounded-lg ${target === 'research' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Academic Research Labs</p>
                <p className="text-[11px] text-slate-500">290+ IIT/IISc professors</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTarget('hr')}
              className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                target === 'hr'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2 rounded-lg ${target === 'hr' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Verified Recruiters</p>
                <p className="text-[11px] text-slate-500">Direct TA lead inboxes</p>
              </div>
            </button>
          </div>
        </div>

        {/* Resume Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              2. Resume / Experience Summary
            </label>
            <button
              type="button"
              onClick={() => setResumeText(SAMPLE_RESUME)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Load Sample Resume</span>
            </button>
          </div>

          <textarea
            rows={6}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text, bio, or skills here..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleMatch}
          disabled={loading || !resumeText.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Evaluating Resume Against Repository...' : 'Run AI Match & Compute Scores'}</span>
        </button>

      </div>

      {/* Analysis Results */}
      {matchData && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Overall Score */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
                <span className="text-2xl font-black text-blue-600 tracking-tight">
                  {matchData.overall_fit}%
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Aggregate Fit Score
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {matchData.overall_fit >= 80 ? 'Exceptional Match' : matchData.overall_fit >= 65 ? 'Strong Potential' : 'Moderate Alignment'}
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated across {matchData.matches?.length || 0} candidate targets.
                </p>
              </div>
            </div>

            {/* Detected Skills */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Detected Core Skills ({matchData.detected_skills?.length || 0})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {matchData.detected_skills?.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended High-Impact Gaps */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  High-Impact Missing Skills
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchData.skill_gaps?.map((gap) => (
                  <span key={gap} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 text-[11px] font-semibold">
                    + {gap}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Ranked Matches Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Top Ranked Opportunities for Your Profile
              </h2>
              <span className="text-xs text-slate-500">
                Sorted by AI Cosine & Keyword Alignment
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matchData.matches?.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Fit Score Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                        item.fit_score >= 85 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : item.fit_score >= 70
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {item.fit_score}% Match
                      </span>

                      {item.type && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {item.type}
                        </span>
                      )}
                    </div>

                    {/* Title & Organization */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {item.title || item.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {item.company || item.institute}
                      </p>
                    </div>

                    {/* Location / Domain */}
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {item.location ? `📍 ${item.location}` : item.department || item.company_niche || ''}
                    </p>

                    {/* Matching Skills */}
                    {item.matched_skills?.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Matching Keywords
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.matched_skills.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    {target === 'jobs' && (
                      <>
                        <button
                          onClick={() => onOpenJob(item.id)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                        >
                          <span>Full Specifications</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        
                        {item.apply_url && (
                          <a
                            href={item.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <span>Apply</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    )}

                    {target === 'research' && item.email && (
                      <a
                        href={`mailto:${item.email}`}
                        className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Lab Directly</span>
                      </a>
                    )}

                    {target === 'hr' && item.email && (
                      <a
                        href={`mailto:${item.email}`}
                        className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Contact Recruiter</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
