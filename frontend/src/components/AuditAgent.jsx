import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  Key, 
  Zap, 
  Layers, 
  Terminal, 
  Copy, 
  Check, 
  RotateCcw, 
  Briefcase, 
  TrendingUp, 
  CheckCheck,
  ExternalLink,
  Target
} from 'lucide-react';

const SAMPLE_AUDIT_RESUME = `Aarav Sharma
Full-Stack AI & Distributed Systems Engineer | Bengaluru, India
aaravsharma.dev | aarav.sharma.dev@gmail.com | github.com/aaravsharma-dev | linkedin.com/in/aarav-sharma-tech

CAREER OBJECTIVE
Full-stack engineer with expertise in building scalable backend systems, autonomous agentic frameworks, and high-performance microservices.

EDUCATION
Indian Institute of Technology (IIT) Delhi (2021 — 2025)
B.Tech in Computer Science & Engineering | CGPA: 9.24 / 10.0

EXPERIENCE
Apex AI Labs, San Francisco, CA (Remote) — Software Engineer Intern (May 2024 — Aug 2024)
- Engineered Model Context Protocol (MCP) integrations for autonomous data exploration pipelines.
- Architected real-time streaming LLM microservices with FastAPI and Redis, decreasing response latency by 35%.

Nexus Systems, Remote — Core Platform Member (Jan 2024 — April 2024)
- Built deterministic policy guards and credential protection layers for autonomous desktop workflow agents.
- Refactored asynchronous data ingestion pipeline, boosting p99 throughput across 50,000+ daily events.

PROJECTS
WinOS-Agent – Autonomous Desktop Execution Environment (Python, C#, FastAPI, WinUI 3, OpenCV, SQLite, LLMs)
- Built a zero-implicit-trust autonomous desktop execution environment treating LLMs as core compute actors.
- Engineered deterministic ALLOW/DENY policies, sandboxed process execution, and SHA-256 hash-chained audit logging.

AgentCommerce – Conversational Agent Payment Gateway (FastAPI, Vector DB, MCP)
- Built an agent commerce gateway converting AI agent purchase intent into authorized transactions.
- Designed backend architecture around secure APIs, vector-based retrieval, and Model Context Protocol (MCP) workflows.

TECHNICAL SKILLS
Languages: Python, Java, JavaScript, TypeScript, Go, SQL
AI & Agentic Systems: LLMs, RAG, MCP, AI Agents, LLM Orchestration, Vector Databases, LangChain, PyTorch
Backend & Frameworks: FastAPI, Node.js, Next.js, React, REST APIs, Microservices
Databases: PostgreSQL, MongoDB, Neo4j, Supabase, Qdrant, Redis
Tools & Infrastructure: Docker, Git, GitHub Actions, Linux, AWS, Cloudflare, CI/CD`;

const POPULAR_SKILL_SETS = [
  { name: "Agentic AI & MCP", count: "12 skills", tag: "AI/ML" },
  { name: "LLM Orchestration & RAG", count: "9 skills", tag: "GenAI" },
  { name: "Low-Latency FastAPI & Redis", count: "8 skills", tag: "Backend" },
  { name: "Kafka & Distributed Systems", count: "10 skills", tag: "Systems" },
  { name: "Vector Databases & Qdrant", count: "6 skills", tag: "Embeddings" },
  { name: "Docker & Cloud Architecture", count: "11 skills", tag: "DevOps" }
];

export default function AuditAgent({ onGoToResume }) {
  const [resumeInput, setResumeInput] = useState(SAMPLE_AUDIT_RESUME);
  const [targetRole, setTargetRole] = useState("Autonomous AI & Systems Engineer");
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const handleRunAudit = async () => {
    if (!resumeInput.trim() || resumeInput.length < 25) {
      alert("Please provide profile or resume text of at least 25 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/audit-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeInput,
          target_role: targetRole,
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAuditData(data);
      } else {
        alert(data.message || "Audit failed");
      }
    } catch (e) {
      console.error("Audit error:", e);
      alert("Failed to connect to Audit Agent engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!auditData) return;
    const txt = `JOBORBIT AUTONOMOUS AUDIT REPORT
Target Role: ${auditData.target_role}
ATS Score: ${auditData.audit?.ats_score}%
Agentic Readiness Score: ${auditData.audit?.agentic_readiness_score}%
Verdict: ${auditData.audit?.executive_verdict}

Verified Skills: ${auditData.detected_skills?.join(', ')}
Missing Critical Skills: ${auditData.audit?.missing_critical_skills?.join(', ')}

STAR Bullet Enhancements:
${auditData.audit?.bullet_audits?.map((b, i) => `${i + 1}. [BEFORE] ${b.original}\n   [STAR FIX] ${b.improved_star}\n   [WHY IT WORKS] ${b.impact}`).join('\n\n')}`;

    navigator.clipboard.writeText(txt);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── 1. HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>JobOrbit Autonomous AI Audit Agent</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>⚡ Autonomous Audit Engine Active</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Intelligent Skill Set &amp; Profile Audit Agent
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            Autonomous deep-scan architecture that parses engineering profiles, evaluates technical skill density against high-yield tech benchmarks, and generates high-converting STAR achievements.
          </p>
        </div>
      </div>

      {/* ── 3. SEARCH INTELLIGENT SKILL SETS & ROLE CONFIGURATION ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Input & Intelligent Skill Explorer (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Target Engineering Role
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Role Benchmark</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                "Autonomous AI & Systems Engineer",
                "Backend Microservices Architect",
                "Full-Stack AI Lead",
                "Cloud & Distributed Systems SDE"
              ].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    targetRole === role
                      ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Intelligent Skill Set Quick-Filter Chips */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Intelligent Skill Matrix Explorer
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILL_SETS.map((sk, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!resumeInput.toLowerCase().includes(sk.name.toLowerCase())) {
                        setResumeInput(prev => `${prev}\n\nKey Domain Competency: ${sk.name}`);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer group"
                    title={`Click to verify or inject ${sk.name} in evaluation`}
                  >
                    <span>{sk.name}</span>
                    <span className="text-[9px] px-1 rounded bg-white text-slate-400 font-mono">
                      {sk.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Input */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Candidate Profile / Resume Source
                </label>
                <button
                  type="button"
                  onClick={() => setResumeInput(SAMPLE_AUDIT_RESUME)}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Sample</span>
                </button>
              </div>
              <textarea
                rows={12}
                value={resumeInput}
                onChange={(e) => setResumeInput(e.target.value)}
                placeholder="Paste candidate resume, tech stack, and achievements here..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono leading-relaxed"
              />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleRunAudit}
              className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Running Deep Autonomous Audit...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Autonomous AI Audit Scan</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right: Live Audit Telemetry & Results (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {auditData ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              
              {/* Scorecard Hero Banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Audit Diagnostic Results
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {auditData.target_role}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyReport}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReport ? 'Copied!' : 'Copy Report'}</span>
                    </button>
                    {onGoToResume && (
                      <button
                        onClick={onGoToResume}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>Open Resume Studio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dual Score Rings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-100 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex flex-col items-center justify-center font-black text-xl shadow-xs shrink-0">
                      <span>{auditData.audit?.ats_score}%</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">ATS Machine Penetration</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                        Probability of passing automated Taleo, Workday, and Lever resume filters.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/80 to-fuchsia-50/40 border border-purple-100 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex flex-col items-center justify-center font-black text-xl shadow-xs shrink-0">
                      <span>{auditData.audit?.agentic_readiness_score}%</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Agentic &amp; Systems Readiness</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                        Proficiency across autonomous LLM tool use, MCP interfaces, and microservices.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Executive Verdict */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Audit Agent Executive Verdict
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {auditData.audit?.executive_verdict}
                  </p>
                </div>
              </div>

              {/* Verified vs Missing Skills Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Skill Density &amp; Gap Diagnostics
                </h4>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 block mb-1.5">
                      ✓ Verified Technical Competencies ({auditData.detected_skills?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {auditData.detected_skills?.map((sk, sIdx) => (
                        <span key={sIdx} className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {auditData.audit?.missing_critical_skills?.length > 0 && (
                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[11px] font-bold text-amber-700 block mb-1.5">
                        ⚠ Missing High-Yield Keywords ({auditData.audit.missing_critical_skills.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {auditData.audit.missing_critical_skills.map((sk, sIdx) => (
                          <span key={sIdx} className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                            + {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* STAR Bullet Enhancements */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center justify-between">
                  <span>STAR Bullet Optimizations (Metric-Driven)</span>
                  <span className="text-[10px] text-blue-600 font-mono font-normal">Quantified Metrics</span>
                </h4>

                <div className="space-y-3">
                  {auditData.audit?.bullet_audits?.map((item, bIdx) => (
                    <div key={bIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="text-xs text-slate-500 line-through">
                        <span className="font-bold text-slate-400 mr-1.5">[Original]:</span>
                        {item.original}
                      </div>

                      <div className="text-xs text-slate-900 font-medium bg-emerald-50/80 border border-emerald-200/80 p-2.5 rounded-lg">
                        <span className="font-bold text-emerald-800 mr-1.5">★ [STAR Optimized]:</span>
                        {item.improved_star}
                      </div>

                      <div className="text-[11px] text-slate-600 italic">
                        <strong>Why it converts:</strong> {item.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* Placeholder state before scanning */
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-xs text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                <Target className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Ready to Audit Candidate Profile
              </h3>

              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Click <strong>"Execute Autonomous AI Audit Scan"</strong> on the left to initiate the full diagnostic pass across skill density, STAR metrics, and ATS compatibility.
              </p>

              <button
                type="button"
                onClick={handleRunAudit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch First Scan Now</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
