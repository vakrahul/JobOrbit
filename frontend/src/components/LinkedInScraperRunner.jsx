import React, { useState } from 'react';
import { 
  Play, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  Mail, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Layers, 
  MapPin, 
  CheckCircle2, 
  Terminal,
  Cpu,
  Clock,
  Send,
  Building2
} from 'lucide-react';

const PRESET_KEYWORDS = [
  { label: 'SDE Intern', value: 'sde intern' },
  { label: 'Remote Intern', value: 'remote intern' },
  { label: 'AI / ML Engineer', value: 'ai ml' },
  { label: 'Cloud Engineer', value: 'cloud engineer' },
  { label: 'FDE (Forward Deployed)', value: 'fde' },
  { label: 'Full Stack Dev', value: 'full stack' },
  { label: 'Fresher Tech 2025/2026', value: 'fresher engineer' },
];

const INTERNSHALA_CATEGORIES = [
  { label: 'Remote / Work From Home', value: 'remote' },
  { label: 'Computer Science', value: 'cs' },
  { label: 'Web Development', value: 'web-dev' },
  { label: 'Python & Django', value: 'python' },
  { label: 'AI & Machine Learning', value: 'ai-ml' },
];

export default function LinkedInScraperRunner({ adminToken, onRefreshStats }) {
  const [platform, setPlatform] = useState('linkedin'); // 'linkedin' | 'internshala'
  const [keywords, setKeywords] = useState('sde intern');
  const [location, setLocation] = useState('India');
  const [category, setCategory] = useState('remote');
  const [limit, setLimit] = useState(20);
  
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [runStats, setRunStats] = useState(null);
  const [scrapedJobs, setScrapedJobs] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedNoteId, setCopiedNoteId] = useState(null);

  const handleRunScraper = async () => {
    setRunning(true);
    setErrorMsg('');
    setSuccessMsg('');
    setRunStats(null);

    const token = adminToken || localStorage.getItem('joborbit_admin_token') || 'joborbit-admin-secret-2026';
    const isLinkedIn = platform === 'linkedin';
    const endpoint = isLinkedIn ? '/api/admin/scrape/linkedin' : '/api/admin/scrape/internshala';
    const payload = isLinkedIn 
      ? { keywords, location, limit: Number(limit) }
      : { category, limit: Number(limit) };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Crawler request failed with HTTP ${res.status}`);
      }

      setRunStats(data.stats || {});
      setScrapedJobs(data.jobs || []);
      setSuccessMsg(data.message || `Successfully scraped and ingested ${data.count || 20} opportunities.`);

      if (onRefreshStats) {
        onRefreshStats();
      }
    } catch (err) {
      console.error("Scraper run error:", err);
      setErrorMsg(err.message || 'Scraper execution encountered an unexpected error.');
    } finally {
      setRunning(false);
    }
  };

  const handleExportCsv = () => {
    if (!scrapedJobs.length) return;
    const headers = ['Title', 'Company', 'Location', 'Posted Date', 'Recruiter Emails', 'Apply URL', 'Source'];
    const rows = scrapedJobs.map(j => [
      `"${(j.title || j.role_title || '').replace(/"/g, '""')}"`,
      `"${(j.company || j.company_hiring || '').replace(/"/g, '""')}"`,
      `"${(j.location || '').replace(/"/g, '""')}"`,
      `"${(j.posted_date || j.timestamp || '').replace(/"/g, '""')}"`,
      `"${(j.emails || []).join('; ')}"`,
      `"${(j.apply_url || (j.apply_links && j.apply_links[0]) || '').replace(/"/g, '""')}"`,
      `"${platform}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `joborbit_${platform}_scraped_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyText = (text, id, type = 'email') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedNoteId(id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Bot Engine Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Targeted Opportunity Bot
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                Cookie Authenticated Session Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Dedicated LinkedIn &amp; Internshala Scraper Runner
            </h2>
            <p className="text-xs text-slate-500 max-w-3xl">
              Extracts high-intent job openings (capped at 20 per run for safety). Run 5–6 times daily to ingest ~100–120 fresh opportunities without triggering platform rate-limits or account bans.
            </p>
          </div>

          {/* Platform Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              onClick={() => { setPlatform('linkedin'); setScrapedJobs([]); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                platform === 'linkedin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>LinkedIn Bot</span>
            </button>
            <button
              onClick={() => { setPlatform('internshala'); setScrapedJobs([]); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                platform === 'internshala'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Internshala Bot</span>
            </button>
          </div>
        </div>

        {/* Configuration Matrix */}
        <div className="mt-5 space-y-4">
          {platform === 'linkedin' ? (
            <>
              {/* Presets Chips */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                  Rotating Keyword Presets (Target 20 Jobs / Run):
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_KEYWORDS.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setKeywords(k.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        keywords === k.value
                          ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Search Keywords</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. sde intern, ai engineer, cloud"
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Location Target</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. India, Remote, Bengaluru"
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Batch Size per Run</label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value={10}>10 Jobs (Quick test)</option>
                    <option value={20}>20 Jobs (Recommended safe batch)</option>
                    <option value={25}>25 Jobs (Maximum safe batch)</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Internshala Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                  Internshala Tech Streams:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {INTERNSHALA_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        category === c.value
                          ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-2xs font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Category Slug</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. remote, cs, web-dev"
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Batch Limit</label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white cursor-pointer"
                  >
                    <option value={10}>10 Internships</option>
                    <option value={20}>20 Internships (Recommended)</option>
                    <option value={30}>30 Internships</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Action Trigger Banner */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Safety protocol: Jitter pauses between requests ensure legitimate browser signature.
              </span>
            </div>

            <button
              onClick={handleRunScraper}
              disabled={running}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                platform === 'linkedin'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Harvesting {platform === 'linkedin' ? 'LinkedIn' : 'Internshala'} (Wait ~15-20s)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run {platform === 'linkedin' ? 'LinkedIn' : 'Internshala'} Harvester ({limit} Jobs)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          {scrapedJobs.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Google Sheets CSV</span>
            </button>
          )}
        </div>
      )}

      {/* Telemetry from Latest Run */}
      {runStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Jobs Harvested</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{scrapedJobs.length}</div>
            <span className="text-xs text-slate-400">Target batch reached</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase">New Ingested</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">+{runStats.added_jobs || 0}</div>
            <span className="text-xs text-emerald-600 font-medium">Added to JobOrbit DB</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Refreshed</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{runStats.updated_jobs || 0}</div>
            <span className="text-xs text-slate-400">Already in inventory</span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-purple-700 uppercase">Recruiter Leads</span>
            <div className="text-2xl font-black text-purple-900 mt-1">+{runStats.added_hrs || 0}</div>
            <span className="text-xs text-purple-600 font-medium">Direct emails saved</span>
          </div>
        </div>
      )}

      {/* Scraped Results Preview Table */}
      {scrapedJobs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Harvested Opportunity Inventory ({scrapedJobs.length} Opportunities)
              </h3>
              <p className="text-xs text-slate-500">
                Parsed JD descriptions with ready-to-send templates and outreach kit.
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV (Google Sheets)</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {scrapedJobs.map((j, idx) => {
              const title = j.title || j.role_title || 'Software Engineer';
              const company = j.company || j.company_hiring || 'Tech Company';
              const loc = j.location || 'India';
              const posted = j.posted_date || j.timestamp || 'Recently';
              const apply = j.apply_url || (j.apply_links && j.apply_links[0]) || '';
              const emails = j.emails || [];
              const rawNote = platform === 'linkedin'
                ? `Hi ${company} Hiring Team, I saw the ${title} opening. With experience in modern software engineering and building scalable systems, I'd love to connect and contribute!`
                : `I am eager to apply for the ${title} internship at ${company}. I have hands-on experience developing projects in modern tech stacks, strong problem-solving fundamentals, and can contribute from Day 1.`;

              return (
                <div key={idx} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600">{company}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{loc}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-400">{posted}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {apply && (
                        <a
                          href={apply}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          <span>Open Listing</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Recruiter Email if available */}
                  {emails.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-purple-900 font-medium">
                        <Mail className="w-3.5 h-3.5 text-purple-600" />
                        <span>Recruiter Email: <strong className="font-mono">{emails[0]}</strong></span>
                      </div>
                      <button
                        onClick={() => copyText(emails[0], idx, 'email')}
                        className="p-1 text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
                        title="Copy Recruiter Email"
                      >
                        {copiedId === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Ready Application Template Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>
                          {platform === 'linkedin' ? 'LinkedIn Connection Note (<300 chars)' : 'Internshala "Why Hire Me" Answer'}
                        </span>
                      </span>

                      <button
                        onClick={() => copyText(rawNote, idx, 'note')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                      >
                        {copiedNoteId === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Template</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 font-mono bg-white p-2.5 rounded-lg border border-slate-200 select-all leading-relaxed">
                      {rawNote}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
