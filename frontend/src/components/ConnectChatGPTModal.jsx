import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Info,
  Terminal,
  Zap
} from 'lucide-react';

export default function ConnectChatGPTModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onOpenAuth, 
  onNavigateToStudio 
}) {
  const [activeTab, setActiveTab] = useState('builtin'); // 'builtin' | 'mcp'
  const [tokenLoading, setTokenLoading] = useState(false);
  const [mcpToken, setMcpToken] = useState('');
  const [copiedField, setCopiedField] = useState('');

  if (!isOpen) return null;

  const mcpUrl = "https://prod-main-api-62dc70-00wtatwcawp.compute.instacloud-edge.com/mcp";
  const sseUrl = "https://prod-main-api-62dc70-00wtatwcawp.compute.instacloud-edge.com/mcp/sse";
  const authUrl = "https://prod-main-api-62dc70-00wtatwcawp.compute.instacloud-edge.com/oauth/authorize?client_id=chatgpt-mcp&redirect_uri=https://chatgpt.com/aip/callback&response_type=code";

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleGenerateToken = async () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth("Please log in to generate an MCP connection token.");
      return;
    }
    setTokenLoading(true);
    try {
      const res = await fetch('/api/auth/mcp-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('joborbit_user_token') || ''}`
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setMcpToken(data.access_token);
      }
    } catch (err) {
      console.error("Token generation error:", err);
    } finally {
      setTokenLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">JobOrbit AI &amp; ChatGPT Integration</h2>
              <p className="text-xs text-slate-500">Autonomous job matching, resume tailoring, and applications</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-slate-100 bg-white flex gap-2">
          <button
            onClick={() => setActiveTab('builtin')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'builtin' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Built-in AI (Instant • 0 Setup)</span>
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mcp' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Connect ChatGPT (Custom MCP)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* TAB 1: BUILT-IN AI */}
          {activeTab === 'builtin' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                    Default &amp; Recommended
                  </span>
                  <span className="text-xs font-bold text-emerald-950">Zero External Subscriptions Required</span>
                </div>
                <p className="text-xs text-emerald-900/80 leading-relaxed">
                  JobOrbit comes built-in with Google Gemini 2.5 Flash intelligence. You do not need ChatGPT Plus, special workspace permissions, or API keys to use it.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">What Built-in AI Does For You</h4>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block">Truthful Resume Tailoring (STAR Method)</strong>
                      <span className="text-slate-500">Aligns your verified achievements with any job description without hallucinating qualifications.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block">Objective ATS Score &amp; Gap Diagnostics</strong>
                      <span className="text-slate-500">Detects matched keywords, missing proficiencies, and concrete recommendations.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block">High-Converting Cold Recruiter Emails</strong>
                      <span className="text-slate-500">One-click outreach notes ready to send to verified talent acquisition contacts.</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  if (onNavigateToStudio) onNavigateToStudio();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Built-in AI Resume Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 2: CONNECT CHATGPT VIA MCP */}
          {activeTab === 'mcp' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Account Requirements</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-900/90">
                  Custom MCP connections are currently available on ChatGPT accounts and workspace configurations that support external MCP connectors. If your ChatGPT plan does not support custom MCP, switch to the <strong>Built-in AI</strong> tab above.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Connection Details</h4>

                {/* MCP Endpoint */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">MCP Server Endpoint</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={mcpUrl} 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all"
                    />
                    <button 
                      onClick={() => handleCopy(mcpUrl, 'mcpUrl')}
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedField === 'mcpUrl' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Direct OAuth Authorize Link */}
                <div className="pt-2">
                  <a
                    href={authUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 text-center"
                  >
                    <span>Authorize ChatGPT via OAuth 2.1</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Personal Access Token (for local MCP clients like Claude Desktop / Cursor) */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">Desktop / Local MCP Bearer Token</span>
                    {!mcpToken && (
                      <button
                        onClick={handleGenerateToken}
                        disabled={tokenLoading}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        {tokenLoading ? "Generating..." : "Generate 90-day Token"}
                      </button>
                    )}
                  </div>
                  {mcpToken && (
                    <div className="flex items-center gap-2">
                      <input 
                        type="password" 
                        readOnly 
                        value={mcpToken} 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all"
                      />
                      <button 
                        onClick={() => handleCopy(mcpToken, 'token')}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
                        title="Copy Token"
                      >
                        {copiedField === 'token' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
