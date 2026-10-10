import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  FileText, 
  Hash, 
  Send, 
  Lock,
  X,
  ChevronRight,
  Info
} from 'lucide-react';

export default function ApplicationReviewModal({ approvalToken, onClose, onActionSuccess }) {
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (!approvalToken) return;
    loadReviewData();
  }, [approvalToken]);

  const loadReviewData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/applications/review/${approvalToken}`);
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        setReviewData(json.data);
      } else {
        setError(json.message || 'Unable to retrieve application review details.');
      }
    } catch (err) {
      setError('Network error loading review data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (approved) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/applications/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('joborbit_jwt_token') || ''}`
        },
        body: JSON.stringify({
          approval_token: approvalToken,
          approved: approved,
          rejection_reason: approved ? null : rejectionReason || 'Declined by candidate.'
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (onActionSuccess) onActionSuccess(data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to submit decision.');
      }
    } catch (err) {
      setError('Network communication failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!approvalToken) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mandatory Application Approval</h2>
              <p className="text-xs text-slate-500">Human-in-the-loop review before external job submission</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {loading && (
            <div className="py-12 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Verifying cryptographic hash and application contents...
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && reviewData && (
            <>
              {/* Target & Verification Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Role & Company</span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {reviewData.draft.target_role} <span className="font-normal text-slate-500">at</span> {reviewData.draft.company_name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {reviewData.approval.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">Destination:</span>
                  <a 
                    href={reviewData.draft.destination_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 hover:underline truncate"
                  >
                    {reviewData.draft.destination_url}
                  </a>
                </div>

                {/* Cryptographic Content Hash */}
                <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded-lg border border-slate-200/80 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400 select-none">SHA256:</span>
                  <span className="truncate">{reviewData.draft.content_hash}</span>
                  <span className="shrink-0 text-emerald-600 font-sans font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                    Rev {reviewData.draft.version}
                  </span>
                </div>
              </div>

              {/* Form Answers Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Application Answers to be Submitted</h4>
                {Object.keys(reviewData.draft.answers || {}).length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 italic border border-slate-100">
                    No custom questionnaire answers attached to this draft.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(reviewData.draft.answers).map(([key, val]) => (
                      <div key={key} className="p-3 rounded-lg border border-slate-200 bg-white">
                        <div className="text-xs font-bold text-slate-700 mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-slate-900 leading-relaxed whitespace-pre-wrap">{String(val)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Candidate Resume Snapshot */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Resume Snapshot Bound to this Application
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 max-h-36 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                  {reviewData.draft.resume_text_snapshot}
                </div>
              </div>

              {/* Consent Guardrail Disclaimer */}
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Approving this application authorizes JobOrbit or ChatGPT to submit this exact content to the employer on your behalf. If any field or resume text changes, this approval is automatically voided.
                </p>
              </div>

              {showRejectForm && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Reason for Declining (Optional):</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Needs more tailored experience bullets"
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && reviewData && (
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
            {!showRejectForm ? (
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
              >
                Decline Draft
              </button>
            ) : (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDecision(false)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
              >
                Confirm Decline
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || reviewData.approval.status === 'CONSUMED'}
                onClick={() => handleDecision(true)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-blue-300" />
                <span>Approve Application</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
