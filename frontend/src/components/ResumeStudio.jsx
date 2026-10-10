import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Code2, 
  RotateCcw, 
  Wand2, 
  Printer, 
  ExternalLink,
  Layers,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Cpu,
  User,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  Target,
  RefreshCw,
  Zap
} from 'lucide-react';

const JD_PRESETS = [
  {
    label: "Zepto — Backend Engineer Intern",
    role: "Backend Software Engineer",
    company: "Zepto",
    jd: "Looking for a Backend Software Engineer Intern with strong Python, FastAPI, and PostgreSQL skills. Experience building scalable microservices, low latency systems, and event-driven pipelines using Redis, Kafka, and Docker. Knowledge of AWS, CI/CD, and asynchronous I/O is a huge plus."
  },
  {
    label: "Google — Software Engineering Intern",
    role: "Software Engineering Intern",
    company: "Google",
    jd: "Seeking Software Engineering Intern with expertise in Data Structures, Algorithms, Python, C++, and Distributed Systems. Experience with microservices, scalable APIs, Linux systems, and concurrent programming. Passion for solving complex high-throughput challenges."
  },
  {
    label: "Amazon — SDE I (Full-Stack)",
    role: "Full-Stack Software Development Engineer",
    company: "Amazon",
    jd: "Amazon is hiring a Full-Stack SDE to design customer-facing web applications and cloud microservices. Required: React, TypeScript, Node.js, Python, PostgreSQL, AWS, Docker, REST APIs, and automated CI/CD testing pipelines."
  },
  {
    label: "Swiggy — AI & Platform Engineer",
    role: "AI & Platform Engineer",
    company: "Swiggy",
    jd: "Seeking an AI Platform Engineer skilled in Python, PyTorch, FastAPI, Vector Databases, and Docker. Experience fine-tuning LLMs, building RAG architectures, and deploying production machine learning microservices with Redis caching and PostgreSQL."
  }
];

const INITIAL_DATA = {
  basics: {
    name: "Aarav Sharma",
    title: "Full-Stack AI & Distributed Systems Engineer",
    email: "aarav.sharma.dev@gmail.com",
    phone: "+91 (987) 654-3210",
    location: "Bengaluru, India",
    github: "github.com/aaravsharma-dev",
    linkedin: "linkedin.com/in/aarav-sharma-tech",
    portfolio: "aaravsharma.dev",
    summary: "Full-stack engineer with expertise in building scalable backend systems, autonomous agentic frameworks, and high-performance microservices.",
    photo: "",
    showPhoto: false,
    photoShape: "circle"
  },
  education: [
    {
      institution: "Indian Institute of Technology (IIT) Delhi",
      degree: "B.Tech in Computer Science & Engineering",
      location: "India",
      start: "2021",
      end: "2025",
      score: "CGPA: 9.24 / 10.0"
    }
  ],
  experience: [
    {
      company: "Apex AI Labs",
      role: "Software Engineer Intern",
      location: "San Francisco, CA (Remote)",
      start: "May 2024",
      end: "Aug 2024",
      bullets: [
        "Engineered Model Context Protocol (MCP) integrations for autonomous data exploration pipelines.",
        "Architected real-time streaming LLM microservices with FastAPI and Redis, decreasing response latency by 35%."
      ]
    },
    {
      company: "Nexus Systems",
      role: "Core Platform Member",
      location: "Remote",
      start: "Jan 2024",
      end: "April 2024",
      bullets: [
        "Built deterministic policy guards and credential protection layers for autonomous desktop workflow agents.",
        "Refactored asynchronous data ingestion pipeline, boosting p99 throughput across 50,000+ daily events."
      ]
    }
  ],
  projects: [
    {
      name: "WinOS-Agent – Autonomous Desktop Execution Environment",
      tech: "Python, C#, FastAPI, WinUI 3, Windows UI Automation, OpenCV, SQLite, LLMs",
      link: "https://github.com/aaravsharma-dev/winos-agent",
      bullets: [
        "Built a zero-implicit-trust autonomous desktop execution environment for Windows that treats LLMs as core compute actors.",
        "Engineered deterministic ALLOW/DENY/REQUIRE_APPROVAL policies, Windows DPAPI credential protection, sandboxed process execution, scoped filesystem operations, and SHA-256 hash-chained audit logging.",
        "Implemented native Windows UI automation, browser workflows, multi-provider LLM adapters, four-tier memory with mistake learning, and autonomous coding loops."
      ]
    },
    {
      name: "AgentCommerce – Conversational Agent Payment Gateway",
      tech: "FastAPI, Vector DB, MCP",
      link: "https://github.com/aaravsharma-dev/agent-commerce",
      bullets: [
        "Built an agent commerce gateway that converts AI agent purchase intent into authorized and verifiable transactions, enabling payments through conversational interfaces such as ChatGPT and Claude.",
        "Designed the backend architecture around secure APIs, vector-based retrieval, and Model Context Protocol (MCP) workflows."
      ]
    }
  ],
  skills: {
    "Languages": ["Python", "Java", "JavaScript", "TypeScript", "Go", "SQL"],
    "AI & Agentic Systems": ["LLMs", "RAG", "MCP", "AI Agents", "LLM Orchestration", "Vector Databases", "LangChain", "PyTorch"],
    "Backend & Frameworks": ["FastAPI", "Node.js", "Next.js", "React", "REST APIs", "Microservices"],
    "Databases": ["PostgreSQL", "MongoDB", "Neo4j", "Supabase", "Qdrant", "Redis"],
    "Tools & Infrastructure": ["Docker", "Git", "GitHub Actions", "Linux", "AWS", "Cloudflare", "CI/CD"],
    "Relevant Coursework": ["Database Management Systems (DBMS)", "Operating Systems (OS)", "Computer Networks", "Distributed Systems"]
  },
  publications: [
    "Publication: \"Investigating Data Leakage-Induced Over-Confidence and Explanation Faithfulness in Deep Transformer Models\" – IEEE / Tech Conference.",
    "Top 3 Finalist out of 800+ teams in the Global Open-Source Agentic AI Hackathon."
  ]
};

export default function ResumeStudio() {
  const photoInputRef = useRef(null);

  const isVip = typeof window !== 'undefined' && localStorage.getItem('joborbit_is_vip') === 'true';

  const [aiTokens, setAiTokens] = useState(() => {
    const saved = localStorage.getItem('joborbit_ai_tokens');
    if (saved) return parseInt(saved, 10);
    return isVip ? 500000 : 2000;
  });

  const [resumeData, setResumeData] = useState(() => {
    const saved = localStorage.getItem('joborbit_resume_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Force upgrade if draft contains old profile or outdated name
        if (!parsed?.basics?.name || parsed.basics.name === "Rahul Vakiti" || parsed.basics.name === "Alex Chen") {
          localStorage.setItem('joborbit_resume_draft', JSON.stringify(INITIAL_DATA));
          return INITIAL_DATA;
        }
        return {
          ...INITIAL_DATA,
          ...parsed,
          basics: {
            ...INITIAL_DATA.basics,
            ...parsed.basics,
            showPhoto: parsed.basics?.showPhoto || false,
          }
        };
      } catch (e) {
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

  const [activeTemplate, setActiveTemplate] = useState('charter'); // 'charter' | 'jake' | 'modern_tech'
  const [accentColor, setAccentColor] = useState('#2563eb'); // Blue
  const [previewMode, setPreviewMode] = useState('paper'); // 'paper' | 'latex'
  const [latexCode, setLatexCode] = useState('');
  const [loadingLatex, setLoadingLatex] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enhancingIndex, setEnhancingIndex] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState('basics'); // 'basics' | 'jd' | 'exp' | 'projects' | 'edu' | 'skills' | 'pubs'
  const [toastMsg, setToastMsg] = useState('');

  // Target Job Description State
  const [jdText, setJdText] = useState(JD_PRESETS[0].jd);
  const [targetRole, setTargetRole] = useState(JD_PRESETS[0].role);
  const [targetCompany, setTargetCompany] = useState(JD_PRESETS[0].company);
  const [tailoringLoading, setTailoringLoading] = useState(false);
  const [tailorAnalysis, setTailorAnalysis] = useState(null);
  const [originalDraftBackup, setOriginalDraftBackup] = useState(null);

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem('joborbit_resume_draft', JSON.stringify(resumeData));
  }, [resumeData]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result;
      setResumeData(prev => ({
        ...prev,
        basics: {
          ...prev.basics,
          photo: base64,
          showPhoto: true,
        }
      }));
      showToast("Headshot uploaded & added to resume!");
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setResumeData(prev => ({
      ...prev,
      basics: {
        ...prev.basics,
        photo: '',
        showPhoto: false,
      }
    }));
    showToast("Photo removed from resume");
  };

  const handleLoadSamplePhoto = () => {
    setResumeData(prev => ({
      ...prev,
      basics: {
        ...prev.basics,
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80",
        showPhoto: true,
      }
    }));
    showToast("Loaded sample headshot");
  };

  // Tailor Resume to Job Description
  const handleTailorResume = async () => {
    if (!jdText.trim()) {
      showToast("Please enter or paste a job description first.");
      return;
    }
    if (!isVip && aiTokens < 450) {
      alert("Free trial AI token limit reached (requires ~450 tokens).\n\nUpgrade to VIP Pass (₹75 / $9.99) for 500,000 AI tokens, unlimited JD tailoring, and verified recruiter inboxes!");
      return;
    }
    setTailoringLoading(true);
    if (!originalDraftBackup) {
      setOriginalDraftBackup(JSON.parse(JSON.stringify(resumeData)));
    }
    try {
      const res = await fetch('/api/resume/tailor-to-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeData,
          job_description: jdText,
          target_title: targetRole,
          company_name: targetCompany
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.tailored_resume) {
        setResumeData(data.tailored_resume);
        setTailorAnalysis(data.analysis);
        const nextTokens = Math.max(0, aiTokens - 450);
        setAiTokens(nextTokens);
        localStorage.setItem('joborbit_ai_tokens', nextTokens.toString());
        showToast(`Tailored to ${targetRole || 'JD'} with ${data.analysis?.tailored_score}% ATS match! (450 AI tokens deducted)`);
      } else {
        alert(data.message || "Tailoring failed");
      }
    } catch (e) {
      console.error("Tailor error:", e);
      alert("Failed to connect to tailoring engine.");
    } finally {
      setTailoringLoading(false);
    }
  };

  // Revert Tailored Resume
  const handleRevertDraft = () => {
    if (originalDraftBackup) {
      setResumeData(originalDraftBackup);
      setTailorAnalysis(null);
      showToast("↩️ Reverted to original resume draft!");
    }
  };

  // Compile LaTeX source on template / data change
  const fetchLatex = async () => {
    setLoadingLatex(true);
    try {
      const res = await fetch('/api/resume/generate-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: resumeData, template: activeTemplate })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setLatexCode(json.latex);
      }
    } catch (e) {
      console.error("LaTeX compilation error:", e);
    } finally {
      setLoadingLatex(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLatex();
    }, 400);
    return () => clearTimeout(timer);
  }, [resumeData, activeTemplate]);

  // AI Bullet Enhancer
  const handleEnhanceBullet = async (section, itemIdx, bulletIdx) => {
    if (!isVip && aiTokens < 150) {
      alert("Free trial AI token limit reached (requires ~150 tokens).\n\nUpgrade to VIP Pass (₹75 / $9.99) for 500,000 AI tokens and unlimited STAR enhancements!");
      return;
    }
    const key = `${section}-${itemIdx}-${bulletIdx}`;
    setEnhancingIndex(key);
    const currentBullet = resumeData[section][itemIdx].bullets[bulletIdx];
    try {
      const res = await fetch('/api/resume/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet: currentBullet })
      });
      const data = await res.json();
      if (data.status === 'success' && data.enhanced) {
        const updated = { ...resumeData };
        updated[section][itemIdx].bullets[bulletIdx] = data.enhanced;
        setResumeData(updated);
        const nextTokens = Math.max(0, aiTokens - 150);
        setAiTokens(nextTokens);
        localStorage.setItem('joborbit_ai_tokens', nextTokens.toString());
        showToast("Bullet point enhanced with quantifiable STAR metrics! (150 AI tokens deducted)");
      }
    } catch (e) {
      console.error("AI enhance error:", e);
    } finally {
      setEnhancingIndex(null);
    }
  };

  // Copy LaTeX code
  const handleCopyLatex = () => {
    if (!latexCode) return;
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    showToast("Compile-ready LaTeX copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .tex
  const handleDownloadTex = () => {
    const candidateName = resumeData.basics.name.replace(/\s+/g, '_') || 'Resume';
    const blob = new Blob([latexCode], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${candidateName}_${activeTemplate}.tex`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(".tex source downloaded!");
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Smooth Direct PDF Export (Single-Page Guaranteed)
  const handlePrintPdf = async () => {
    const candidateName = (resumeData.basics.name || 'Resume').replace(/\s+/g, '_');
    const element = document.getElementById('resume-print-area');
    
    setDownloadingPdf(true);
    showToast("Generating crisp 1-page PDF document...");

    try {
      if (element) {
        const opt = {
          margin: 0,
          filename: `${candidateName}_Resume.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            logging: false,
            width: 794,
            windowWidth: 794,
            backgroundColor: '#ffffff'
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: 'avoid-all' }
        };
        await html2pdf().set(opt).from(element).save();
        showToast("Downloaded crisp 1-page PDF successfully!");
        setDownloadingPdf(false);
        return;
      }
    } catch (err) {
      console.warn("html2pdf canvas export warning, using isolated print fallback:", err);
    }

    // Direct browser print fallback with isolated document title
    const origTitle = document.title;
    document.title = `${candidateName}_Resume`;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = origTitle;
        setDownloadingPdf(false);
      }, 1000);
    }, 150);
  };

  // Reset to sample
  const handleResetSample = () => {
    setResumeData(INITIAL_DATA);
    localStorage.setItem('joborbit_resume_draft', JSON.stringify(INITIAL_DATA));
    showToast("Loaded authentic gold-standard profile!");
  };

  return (
    <div className="space-y-6 pb-20 print:space-y-0 print:pb-0">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Standalone AI LaTeX Resume Studio</span>
            </div>
            {isVip ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>VIP Unlimited: {aiTokens.toLocaleString()} AI Tokens (Unlimited Quota)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold">
                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                <span>Free Quota: {aiTokens.toLocaleString()} / 2,000 Tokens</span>
                <a href="#vip" className="underline text-purple-700 hover:text-purple-900 ml-1">Unlock 500k VIP</a>
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ATS-Engineered Tech Resume Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build 100% ATS-parseable tech resumes. Switch templates instantly, refine bullets with AI, and download clean <strong className="text-slate-800">.tex</strong> or <strong className="text-slate-800">PDF</strong>.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setActiveTab('jd')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              activeTab === 'jd'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-2 ring-blue-500/30'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            }`}
            title="Tailor resume to any target Job Description"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Tailor to JD</span>
          </button>

          <button
            onClick={handleResetSample}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset to gold-standard developer profile"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample</span>
          </button>


          <button
            onClick={handlePrintPdf}
            disabled={downloadingPdf}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download crisp print-quality PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:gap-0">
        
        {/* LEFT COLUMN: Section Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col print:hidden">
          
          {/* Section Navigation Tabs */}
          <div className="flex items-center overflow-x-auto border-b border-slate-200 p-2 gap-1 bg-slate-50/60 scrollbar-none">
            {[
              { id: 'jd', label: 'Target Job (JD)', icon: Target, badge: 'AI Tailor' },
              { id: 'basics', label: 'Profile', icon: User },
              { id: 'exp', label: 'Experience', icon: Briefcase },
              { id: 'projects', label: 'Projects', icon: FolderGit2 },
              { id: 'edu', label: 'Education', icon: GraduationCap },
              { id: 'skills', label: 'Skills', icon: Cpu },
              { id: 'pubs', label: 'Pubs & Honors', icon: Sparkles },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div className="p-5 max-h-[750px] overflow-y-auto space-y-5">
            
            {/* 0. TARGET JOB DESCRIPTION TAB */}
            {activeTab === 'jd' && (
              <div className="space-y-4">
                
                {/* Header / Pitch */}
                <div className="p-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Job Description Tailoring Engine</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      ATS Auto-Align
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Paste any job description from LinkedIn, Indeed, or career sites. Our engine extracts hard technical keywords, restructures your summary, and injects STAR achievements to guarantee a 90%+ ATS match score.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Quick-Fill Popular Roles:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {JD_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setTargetRole(preset.role);
                          setTargetCompany(preset.company);
                          setJdText(preset.jd);
                          showToast(`Loaded ${preset.label} details!`);
                        }}
                        className="p-2 text-left rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 truncate">
                          {preset.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {preset.company} · {preset.role}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Role / Title</label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Backend Software Engineer"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Company Name</label>
                    <input
                      type="text"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      placeholder="e.g. Zepto, Google, Amazon"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Job Description Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">Paste Full Job Description (JD)</label>
                    <span className="text-[10px] text-slate-400 font-mono">{jdText.length} chars</span>
                  </div>
                  <textarea
                    rows={6}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste JD requirements, tech stack, responsibilities, and qualifications..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono leading-relaxed"
                  />
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={tailoringLoading || !jdText.trim()}
                    onClick={handleTailorResume}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {tailoringLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing JD & Restructuring Resume...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tailor Resume to this Job Description</span>
                      </>
                    )}
                  </button>

                  {originalDraftBackup && (
                    <button
                      type="button"
                      onClick={handleRevertDraft}
                      className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title="Revert to original resume draft"
                    >
                      <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                      Revert
                    </button>
                  )}
                </div>

                {/* Analysis Telemetry Card */}
                {tailorAnalysis && (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">ATS Match Boost Results</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 line-through">{tailorAnalysis.original_score}%</span>
                        <span className="text-sm font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          {tailorAnalysis.tailored_score}% Match
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-700" 
                        style={{ width: `${tailorAnalysis.tailored_score}%` }}
                      />
                    </div>

                    {/* Matched & Injected Skills */}
                    <div className="space-y-2 pt-1">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Keywords Aligned ({tailorAnalysis.matched_skills?.length || 0}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tailorAnalysis.matched_skills?.map((sk, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      {tailorAnalysis.injected_skills?.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-purple-700 uppercase mb-1">
                            Keywords Injected into Stack ({tailorAnalysis.injected_skills.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {tailorAnalysis.injected_skills.map((sk, sIdx) => (
                              <span key={sIdx} className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                                + {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Improvements Checklist */}
                    <div className="border-t border-emerald-200/80 pt-2 space-y-1 text-[11px] text-slate-700">
                      {tailorAnalysis.improvements?.map((imp, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{imp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 1. BASICS TAB */}
            {activeTab === 'basics' && (
              <div className="space-y-4">
                
                {/* Profile Photo / Headshot Manager */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">Profile Photo / Headshot</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!resumeData.basics.showPhoto}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          basics: { ...prev.basics, showPhoto: e.target.checked }
                        }))}
                        className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-[11px] font-semibold text-slate-600">Show on Resume</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Avatar Preview */}
                    <div className="relative shrink-0">
                      {resumeData.basics.photo ? (
                        <img
                          src={resumeData.basics.photo}
                          alt="Avatar"
                          className={`w-14 h-14 object-cover border-2 border-white shadow-xs ${
                            resumeData.basics.photoShape === 'circle' ? 'rounded-full' :
                            resumeData.basics.photoShape === 'rounded' ? 'rounded-xl' : 'rounded-none'
                          }`}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border border-slate-300 border-dashed">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleLoadSamplePhoto}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                        >
                          Sample Photo
                        </button>

                        {resumeData.basics.photo && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="p-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Shape Selector */}
                      {resumeData.basics.photo && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Shape:</span>
                          {['circle', 'rounded', 'square'].map(shape => (
                            <button
                              key={shape}
                              type="button"
                              onClick={() => setResumeData(prev => ({
                                ...prev,
                                basics: { ...prev.basics, photoShape: shape }
                              }))}
                              className={`px-2 py-0.5 rounded capitalize font-medium cursor-pointer ${
                                resumeData.basics.photoShape === shape
                                  ? 'bg-blue-100 text-blue-700 font-bold'
                                  : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                              }`}
                            >
                              {shape}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal & Contact Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.basics.name}
                      onChange={(e) => setResumeData({ ...resumeData, basics: { ...resumeData.basics, name: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Title</label>
                    <input
                      type="text"
                      value={resumeData.basics.title}
                      onChange={(e) => setResumeData({ ...resumeData, basics: { ...resumeData.basics, title: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                    <input
                      type="email"
                      value={resumeData.basics.email}
                      onChange={(e) => setResumeData({ ...resumeData, basics: { ...resumeData.basics, email: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={resumeData.basics.phone}
                      onChange={(e) => setResumeData({ ...resumeData, basics: { ...resumeData.basics, phone: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Location</label>
                    <input
                      type="text"
                      value={resumeData.basics.location}
                      onChange={(e) => setResumeData({ ...resumeData, basics: { ...resumeData.basics, location: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">GitHub (e.g. github.com/user)</label>
                    <input
                      type="text"
                      value={resumeData.basics.github}
                      onChange={(e) => setResumeData({ ...resumeData, basics: { ...resumeData.basics, github: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">LinkedIn</label>
                    <input
                      type="text"
                      value={resumeData.basics.linkedin}
                      onChange={(e) => setResumeData({ ...resumeData, basics: { ...resumeData.basics, linkedin: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Portfolio / Website</label>
                    <input
                      type="text"
                      value={resumeData.basics.portfolio}
                      onChange={(e) => setResumeData({ ...resumeData, basics: { ...resumeData.basics, portfolio: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Professional Summary / Objective</label>
                  <textarea
                    rows={3}
                    value={resumeData.basics.summary}
                    onChange={(e) => setResumeData({ ...resumeData, basics: { ...resumeData.basics, summary: e.target.value } })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 2. EXPERIENCE TAB */}
            {activeTab === 'exp' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Work Experience & Internships</h3>
                  <button
                    onClick={() => {
                      const updated = { ...resumeData };
                      updated.experience.push({
                        company: "Company Name",
                        role: "Role Title",
                        location: "City, Country",
                        start: "2024",
                        end: "Present",
                        bullets: ["Describe quantifiable impact and tech stack used."]
                      });
                      setResumeData(updated);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Role</span>
                  </button>
                </div>

                {resumeData.experience.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group">
                    <button
                      onClick={() => {
                        const updated = { ...resumeData };
                        updated.experience.splice(idx, 1);
                        setResumeData(updated);
                      }}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-2 gap-2.5 pr-8">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Role Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.experience[idx].role = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.experience[idx].company = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Start Date</label>
                        <input
                          type="text"
                          value={exp.start}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.experience[idx].start = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">End Date</label>
                        <input
                          type="text"
                          value={exp.end}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.experience[idx].end = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Bullets with AI Enhancer */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">Achievement Bullets (STAR Method)</span>
                        <button
                          onClick={() => {
                            const updated = { ...resumeData };
                            updated.experience[idx].bullets.push("Quantified achievement with metric impact.");
                            setResumeData(updated);
                          }}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Bullet</span>
                        </button>
                      </div>

                      {exp.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="space-y-1">
                          <div className="flex items-start gap-1.5">
                            <textarea
                              rows={2}
                              value={b}
                              onChange={(e) => {
                                const updated = { ...resumeData };
                                updated.experience[idx].bullets[bIdx] = e.target.value;
                                setResumeData(updated);
                              }}
                              className="w-full p-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                            />
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                onClick={() => handleEnhanceBullet('experience', idx, bIdx)}
                                disabled={enhancingIndex === `experience-${idx}-${bIdx}`}
                                className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                                title="AI Enhance with Action Verbs & Metrics"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  const updated = { ...resumeData };
                                  updated.experience[idx].bullets.splice(bIdx, 1);
                                  setResumeData(updated);
                                }}
                                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete bullet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. PROJECTS TAB */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Projects</h3>
                  <button
                    onClick={() => {
                      const updated = { ...resumeData };
                      updated.projects.push({
                        name: "New Project",
                        tech: "React, Node.js, MongoDB",
                        link: "github.com/user/project",
                        bullets: ["Built end-to-end fullstack platform with automated CI/CD."]
                      });
                      setResumeData(updated);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {resumeData.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative">
                    <button
                      onClick={() => {
                        const updated = { ...resumeData };
                        updated.projects.splice(idx, 1);
                        setResumeData(updated);
                      }}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-2 gap-2.5 pr-8">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Project Name</label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.projects[idx].name = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Tech Stack</label>
                        <input
                          type="text"
                          value={proj.tech}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.projects[idx].tech = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Repository / Live Demo Link</label>
                        <input
                          type="text"
                          value={proj.link}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.projects[idx].link = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">Project Bullets</span>
                        <button
                          onClick={() => {
                            const updated = { ...resumeData };
                            updated.projects[idx].bullets.push("Integrated automated testing suite achieving 95% branch coverage.");
                            setResumeData(updated);
                          }}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Bullet</span>
                        </button>
                      </div>

                      {proj.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-1.5">
                          <textarea
                            rows={2}
                            value={b}
                            onChange={(e) => {
                              const updated = { ...resumeData };
                              updated.projects[idx].bullets[bIdx] = e.target.value;
                              setResumeData(updated);
                            }}
                            className="w-full p-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                          />
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => handleEnhanceBullet('projects', idx, bIdx)}
                              disabled={enhancingIndex === `projects-${idx}-${bIdx}`}
                              className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                              title="AI Enhance"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const updated = { ...resumeData };
                                updated.projects[idx].bullets.splice(bIdx, 1);
                                setResumeData(updated);
                              }}
                              className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. EDUCATION TAB */}
            {activeTab === 'edu' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Education Details</h3>
                  <button
                    onClick={() => {
                      const updated = { ...resumeData };
                      updated.education.push({
                        institution: "University Name",
                        degree: "Bachelor of Science",
                        location: "City, State",
                        start: "2020",
                        end: "2024",
                        score: "8.5 CGPA"
                      });
                      setResumeData(updated);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </button>
                </div>

                {resumeData.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative">
                    <button
                      onClick={() => {
                        const updated = { ...resumeData };
                        updated.education.splice(idx, 1);
                        setResumeData(updated);
                      }}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-2 gap-2.5 pr-8">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Institution / College</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.education[idx].institution = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Degree / Major</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.education[idx].degree = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Dates (e.g. 2021 -- 2025)</label>
                        <input
                          type="text"
                          value={`${edu.start} - ${edu.end}`}
                          onChange={(e) => {
                            const parts = e.target.value.split('-');
                            const updated = { ...resumeData };
                            updated.education[idx].start = parts[0]?.trim() || '';
                            updated.education[idx].end = parts[1]?.trim() || '';
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">CGPA / Percentage</label>
                        <input
                          type="text"
                          value={edu.score}
                          onChange={(e) => {
                            const updated = { ...resumeData };
                            updated.education[idx].score = e.target.value;
                            setResumeData(updated);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. SKILLS TAB */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Skills by Category</h3>
                {Object.entries(resumeData.skills).map(([category, items], idx) => (
                  <div key={category} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700">{category}</label>
                    <input
                      type="text"
                      value={Array.isArray(items) ? items.join(', ') : items}
                      onChange={(e) => {
                        const splitted = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        const updated = { ...resumeData };
                        updated.skills[category] = splitted;
                        setResumeData(updated);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Comma-separated items (e.g. Python, SQL, Docker)"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 6. PUBS & HONORS TAB */}
            {activeTab === 'pubs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Publications &amp; Achievements</h3>
                  <button
                    onClick={() => {
                      const updated = { ...resumeData };
                      updated.publications = updated.publications || [];
                      updated.publications.push("New Publication or Achievement description...");
                      setResumeData(updated);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
                {(resumeData.publications || []).map((pub, pIdx) => (
                  <div key={pIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 relative">
                    <div className="flex items-start justify-between gap-2">
                      <textarea
                        rows={3}
                        value={pub}
                        onChange={(e) => {
                          const updated = { ...resumeData };
                          updated.publications[pIdx] = e.target.value;
                          setResumeData(updated);
                        }}
                        className="w-full p-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans"
                      />
                      <button
                        onClick={() => {
                          const updated = { ...resumeData };
                          updated.publications.splice(pIdx, 1);
                          setResumeData(updated);
                        }}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                        title="Delete publication"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Live Split-Screen Paper Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4 print:space-y-0">
          
          {/* Hidden File Picker for Photo Upload */}
          <input 
            type="file" 
            ref={photoInputRef} 
            accept="image/*" 
            onChange={handlePhotoUpload} 
            className="hidden" 
          />

          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            
            {/* Template Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTemplate('charter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTemplate === 'charter'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bitstream Charter (Single-Page LaTeX ATS Standard)
              </button>
              <button
                onClick={() => setActiveTemplate('jake')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTemplate === 'jake'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jake's Resume (FAANG Classic)
              </button>
            </div>

            {/* Paper Preview Indicator */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Visual 1-Page A4 ATS Sheet</span>
              </div>
            </div>

          </div>

          {/* VIEW: Visual Paper Preview (Single-Page A4 ATS Sheet) */}
          <div className="overflow-x-auto pb-6 flex justify-center">
            <div 
              id="resume-print-area"
              className="bg-white text-black transition-all shadow-xl border border-slate-200/80 print:shadow-none print:border-none print:m-0 print:p-0"
              style={{
                width: '794px',
                minHeight: '1122px',
                boxSizing: 'border-box',
                padding: '1.8cm',
                fontFamily: activeTemplate === 'charter' 
                  ? "'Charter', 'Bitstream Charter', 'Cambria', 'Georgia', serif" 
                  : "'Times New Roman', Times, serif",
                fontSize: '10pt',
                lineHeight: 1.35,
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              {/* Header: Exact Image 2 format */}
              <div className="text-center pb-1 mb-2">
                <h1 className="text-[22pt] font-bold text-black tracking-tight leading-none mb-1 text-center">
                  {resumeData.basics.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9pt] text-black leading-normal">
                  {resumeData.basics.portfolio && (
                    <a 
                      href={`https://${resumeData.basics.portfolio.replace(/^https?:\/\//, '').replace(/\/$/, '')}/`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-black hover:underline"
                    >
                      {resumeData.basics.portfolio.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  )}
                  {resumeData.basics.phone && <span>| {resumeData.basics.phone}</span>}
                  {resumeData.basics.email && (
                    <span>| <a href={`mailto:${resumeData.basics.email}`} className="text-black hover:underline">{resumeData.basics.email}</a></span>
                  )}
                  {resumeData.basics.linkedin && (
                    <span>| <a 
                      href={`https://${resumeData.basics.linkedin.replace(/^https?:\/\//, '').replace(/\/$/, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-black hover:underline"
                    >
                      {resumeData.basics.linkedin.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a></span>
                  )}
                  {resumeData.basics.github && (
                    <span>| <a 
                      href={`https://${resumeData.basics.github.replace(/^https?:\/\//, '').replace(/\/$/, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-black hover:underline"
                    >
                      {resumeData.basics.github.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a></span>
                  )}
                </div>
              </div>

              {/* Career Objective */}
              {resumeData.basics.summary && (
                <div className="mb-2">
                  <h2 className="text-[11.5pt] font-bold text-black border-b border-black pb-[1px] mb-1 mt-2">
                    Career Objective
                  </h2>
                  <p className="text-[9.5pt] text-black leading-snug">
                    {resumeData.basics.summary}
                  </p>
                </div>
              )}

              {/* Education */}
              {resumeData.education?.length > 0 && (
                <div className="mb-2">
                  <h2 className="text-[11.5pt] font-bold text-black border-b border-black pb-[1px] mb-1 mt-2.5">
                    Education
                  </h2>
                  {resumeData.education.map((edu, idx) => (
                    <div key={idx} className="text-[9.5pt] text-black mb-1">
                      <div className="flex justify-between font-bold text-black">
                        <span>{edu.institution}{edu.location ? `, ${edu.location}` : ''}</span>
                        <span>{edu.start} — {edu.end}</span>
                      </div>
                      <div className="flex justify-between items-center text-black pl-3 text-[9.5pt]">
                        <span>• {edu.degree}</span>
                        {edu.score && <span className="font-bold">{edu.score}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {resumeData.experience?.length > 0 && (
                <div className="mb-2">
                  <h2 className="text-[11.5pt] font-bold text-black border-b border-black pb-[1px] mb-1 mt-2.5">
                    Experience
                  </h2>
                  {resumeData.experience.map((exp, idx) => (
                    <div key={idx} className="text-[9.5pt] text-black mb-1.5">
                      <div className="flex justify-between font-bold text-black">
                        <span>{exp.company}{exp.location ? `, ${exp.location}` : ''}</span>
                        <span>{exp.start} — {exp.end}</span>
                      </div>
                      <div className="italic text-black text-[9pt] leading-tight">{exp.role}</div>
                      <ul className="pl-3 space-y-0.5 text-black text-[9.5pt] leading-snug pt-0.5">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-1.5">
                            <span className="select-none">–</span>
                            <span className="flex-1">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {resumeData.projects?.length > 0 && (
                <div className="mb-2">
                  <h2 className="text-[11.5pt] font-bold text-black border-b border-black pb-[1px] mb-1 mt-2.5">
                    Projects
                  </h2>
                  {resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="text-[9.5pt] text-black mb-1.5">
                      <div className="flex justify-between font-bold text-black">
                        <span>{proj.name}</span>
                        {proj.link && (
                          <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" className="text-black hover:underline font-normal text-[9pt]">
                            GitHub Repository
                          </a>
                        )}
                      </div>
                      <ul className="pl-3 space-y-0.5 text-black text-[9.5pt] leading-snug pt-0.5">
                        {proj.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-1.5">
                            <span className="select-none">–</span>
                            <span className="flex-1">{b}</span>
                          </li>
                        ))}
                      </ul>
                      {proj.tech && (
                        <div className="text-[9pt] text-black pt-0.5 leading-snug">
                          <strong>Tech:</strong> {proj.tech}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Technical Skills */}
              {resumeData.skills && Object.keys(resumeData.skills).length > 0 && (
                <div className="mb-2">
                  <h2 className="text-[11.5pt] font-bold text-black border-b border-black pb-[1px] mb-1 mt-2.5">
                    Technical Skills
                  </h2>
                  <div className="text-[9pt] space-y-0.5 text-black leading-tight">
                    {Object.entries(resumeData.skills).map(([cat, items]) => (
                      <div key={cat} className="leading-snug">
                        <strong>{cat}:</strong> {Array.isArray(items) ? items.join(', ') : items}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications & Achievements */}
              {resumeData.publications?.length > 0 && (
                <div className="mb-1">
                  <h2 className="text-[11.5pt] font-bold text-black border-b border-black pb-[1px] mb-1 mt-2.5">
                    Publications &amp; Achievements
                  </h2>
                  <ul className="pl-3 space-y-0.5 text-black text-[9pt] leading-snug">
                    {resumeData.publications.map((pub, pIdx) => {
                      const cleanText = pub
                        .replace(/\\textbf{([^}]+)}/g, '$1')
                        .replace(/\\textit{([^}]+)}/g, '$1')
                        .replace(/``|''/g, '"');
                      return (
                        <li key={pIdx} className="flex items-start gap-1.5">
                          <span className="select-none">•</span>
                          <span className="flex-1">{cleanText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
