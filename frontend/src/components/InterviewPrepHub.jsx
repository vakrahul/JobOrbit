import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  BookOpen, 
  Cpu, 
  Network, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export default function InterviewPrepHub() {
  const [tracks, setTracks] = useState([]);
  const [activeTrack, setActiveTrack] = useState('ai-engineer');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [search, setSearch] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 330, total_pages: 1 });
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch track metadata
  useEffect(() => {
    fetch('/api/prep/tracks')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setTracks(data.tracks || []);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch questions
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        track: activeTrack,
        page: page.toString(),
        limit: '15'
      });
      if (selectedTopic !== 'all') params.append('topic', selectedTopic);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      if (search) params.append('q', search);

      const res = await fetch(`/api/prep/questions?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setQuestions(data.questions || []);
        setPagination(data.pagination || { total: 0, total_pages: 1 });
        if (data.questions?.length > 0 && !expandedId) {
          setExpandedId(data.questions[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch questions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [activeTrack, selectedTopic, selectedDifficulty, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  const copyAnswer = (e, id, answer) => {
    e.stopPropagation();
    navigator.clipboard.writeText(answer);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentTrackData = tracks.find(t => t.track === activeTrack);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Curated Engineering Interview Hub</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Technical Interview & Concept Vault
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            330+ interview-tested questions across modern AI Engineering (LLMs, RAG, Agentic AI, LoRA) and High-Scale System Design. Includes model conversational responses—exactly what to say out loud.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search question, keyword (e.g. RAG, LoRA, Caching, Sharding)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Track Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={() => { setActiveTrack('ai-engineer'); setSelectedTopic('all'); setPage(1); }}
          className={`flex-1 p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            activeTrack === 'ai-engineer'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeTrack === 'ai-engineer' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Engineer Track</h3>
              <p className={`text-xs ${activeTrack === 'ai-engineer' ? 'text-blue-100' : 'text-slate-500'}`}>
                Agentic AI, RAG, LLMOps, Fine-tuning, Vector DBs
              </p>
            </div>
          </div>
          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
            activeTrack === 'ai-engineer' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            310 Qs
          </span>
        </button>

        <button
          onClick={() => { setActiveTrack('system-design'); setSelectedTopic('all'); setPage(1); }}
          className={`flex-1 p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            activeTrack === 'system-design'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeTrack === 'system-design' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">System Design Track</h3>
              <p className={`text-xs ${activeTrack === 'system-design' ? 'text-blue-100' : 'text-slate-500'}`}>
                Distributed architectures, caching, databases & scale
              </p>
            </div>
          </div>
          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
            activeTrack === 'system-design' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            20 Qs
          </span>
        </button>
      </div>

      {/* Topic Sub-filters */}
      {currentTrackData?.topics?.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => { setSelectedTopic('all'); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              selectedTopic === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            All Subtopics ({currentTrackData.total_questions})
          </button>

          {currentTrackData.topics.map((t) => (
            <button
              key={t.topic}
              onClick={() => { setSelectedTopic(t.topic); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                selectedTopic === t.topic
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      )}

      {/* Difficulty & Count Bar */}
      <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-3">
        <span className="font-semibold text-slate-700">
          Showing {pagination.total} Questions
        </span>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Difficulty:</span>
          {['all', 'Easy', 'Medium', 'Hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => { setSelectedDifficulty(diff); setPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                selectedDifficulty === diff
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {diff === 'all' ? 'All' : diff}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse space-y-3">
              <div className="h-5 w-3/4 bg-slate-100 rounded"></div>
              <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No questions found</h3>
          <p className="text-xs text-slate-500">Try adjusting your topic or difficulty filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const isExpanded = expandedId === q.id;
            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        q.difficulty === 'Easy'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : q.difficulty === 'Hard'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {q.difficulty}
                      </span>

                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {q.topic_label}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  <div className="text-slate-400 p-1 shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Answer Content */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/50">
                    
                    {/* Header info */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>What To Say Out Loud (Model Response)</span>
                      </div>

                      <button
                        onClick={(e) => copyAnswer(e, q.id, q.answer)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        {copiedId === q.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Formatted Answer */}
                    <div className="text-xs sm:text-[13px] leading-relaxed text-slate-800 bg-white p-4 rounded-xl border border-slate-200 font-sans whitespace-pre-line shadow-xs">
                      {q.answer}
                    </div>

                    {/* Key Takeaways */}
                    {q.key_takeaways && (
                      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/50 space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block">
                          Key Takeaways / Memorization Points
                        </span>
                        <p className="text-xs text-blue-800 leading-relaxed whitespace-pre-line font-medium">
                          {q.key_takeaways}
                        </p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500 font-medium">
            Page {page} of {pagination.total_pages} ({pagination.total} questions)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-700">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
