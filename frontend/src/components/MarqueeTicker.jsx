import React from 'react';

export default function MarqueeTicker() {
  const items = [
    "9,721 Verified Opportunities",
    "Direct HR Recruiter Emails",
    "Amazon, Optiver, Canonical, Rubrik Hiring",
    "192 New Roles Added Today",
    "Batch 2025 / 2026 / 2027 Eligible",
    "Global Remote & US Tech Roles",
    "Zero Third-Party Redirects",
    "Automated 3-Hour Sync Cycle"
  ];

  return (
    <div className="border-b border-slate-200 bg-slate-100/80 py-2 overflow-hidden select-none text-xs text-slate-600 font-medium print:hidden">
      <div className="marquee-track">
        {[...items, ...items].map((text, index) => (
          <span key={index} className="inline-flex items-center gap-3 mx-5">
            <span>{text}</span>
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block opacity-70"></span>
          </span>
        ))}
      </div>
    </div>
  );
}
