import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  Send, 
  Bookmark, 
  ExternalLink,
  Crown,
  Briefcase,
  Sparkles
} from 'lucide-react';

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onOpenVIP,
  onNavigateToTracker 
}) {
  const [appliedCount, setAppliedCount] = useState(0);
  const [isVip, setIsVip] = useState(false);
  const [reviews, setReviews] = useState([]);
  
  // Review Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submittedReview, setSubmittedReview] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // 1. Read applied count
    const count = parseInt(localStorage.getItem('joborbit_applied_count') || '0', 10);
    setAppliedCount(count);

    // 2. Read VIP status
    const vipStatus = localStorage.getItem('joborbit_is_vip') === 'true' || currentUser?.is_vip;
    setIsVip(!!vipStatus);

    // 3. Load user reviews from localStorage
    try {
      const storedReviews = JSON.parse(localStorage.getItem('joborbit_community_reviews') || '[]');
      setReviews(storedReviews);
      
      const email = currentUser?.email;
      if (email) {
        const existing = storedReviews.find(r => r.email === email);
        if (existing) {
          setSubmittedReview(existing);
          setRating(existing.rating);
          setUserRole(existing.role || '');
          setReviewText(existing.text || '');
        }
      }
    } catch (e) {
      console.error("Error loading reviews:", e);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const newReview = {
      id: Date.now().toString(),
      name: currentUser?.name || currentUser?.email?.split('@')[0] || 'Verified JobOrbit User',
      email: currentUser?.email || 'user@joborbit.live',
      role: userRole.trim() || 'Software Engineer',
      rating: rating,
      text: reviewText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    try {
      const stored = JSON.parse(localStorage.getItem('joborbit_community_reviews') || '[]');
      const filtered = stored.filter(r => r.email !== newReview.email);
      const updated = [newReview, ...filtered];
      localStorage.setItem('joborbit_community_reviews', JSON.stringify(updated));
      setSubmittedReview(newReview);
      setSuccessMsg('Review submitted successfully! Thank you for your feedback.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Failed to save review:", err);
    }
  };

  const name = currentUser?.name || currentUser?.email?.split('@')[0] || 'Candidate';
  const email = currentUser?.email || 'candidate@joborbit.live';

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#FAF9F5] border-b border-[#EBE6DD] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0EBE0] text-stone-900 flex items-center justify-center font-bold text-base border border-[#E0D9CB]">
              {name[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">
                {name}
              </h2>
              <p className="text-xs text-stone-500 font-mono">
                {email}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">

          {/* Account Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Account Status */}
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#EBE6DD]">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Account Status
              </span>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${isVip ? 'text-amber-800' : 'text-stone-800'}`}>
                  {isVip ? 'VIP Member' : 'Free Trial'}
                </span>
                {isVip ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Active
                  </span>
                ) : (
                  <button 
                    onClick={() => { onClose(); onOpenVIP?.(); }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Upgrade (₹75)
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Applications Submitted */}
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#EBE6DD]">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Applications Used
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-900">
                  {appliedCount} {isVip ? 'applied' : '/ 5 used'}
                </span>
                {onNavigateToTracker && (
                  <button 
                    onClick={() => { onClose(); onNavigateToTracker(); }}
                    className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Tracker</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Review & Feedback Section */}
          <div className="pt-2 border-t border-stone-100">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Candidate Review &amp; Feedback
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Share your candid experience using JobOrbit to help fellow engineers and applicants.
              </p>
            </div>

            {successMsg && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-3 bg-[#FAF9F5] p-4 rounded-xl border border-[#EBE6DD]">
              
              {/* Star Rating Selector */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Overall Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star 
                        className={`w-5 h-5 ${
                          (hoverRating || rating) >= star 
                            ? 'text-amber-500 fill-amber-500' 
                            : 'text-stone-300'
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-700 ml-2">
                    {rating} out of 5 Stars
                  </span>
                </div>
              </div>

              {/* User Title / Role */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Your Current Role / Title (Optional)
                </label>
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  placeholder="e.g. SDE-1 @ Startup, 2026 CS Grad, Frontend Dev"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#DDD6C9] focus:outline-none focus:border-stone-500 text-stone-800"
                />
              </div>

              {/* Review Textarea */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Your Honest Review
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write about the speed of newly posted jobs, direct recruiter emails, ATS application experience..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#DDD6C9] focus:outline-none focus:border-stone-500 text-stone-800 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-stone-400">
                  {submittedReview ? 'Updates your existing review' : 'Displays on community page'}
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittedReview ? 'Update Review' : 'Submit Review'}</span>
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF9F5] border-t border-[#EBE6DD] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
