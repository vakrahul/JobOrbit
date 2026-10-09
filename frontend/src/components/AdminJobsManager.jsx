import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw,
  Sparkles,
  Calendar,
  Briefcase
} from 'lucide-react';

export default function AdminJobsManager({ adminToken }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: 'Remote / India',
    region: 'India',
    job_type: 'Full-time',
    pay: 'Competitive',
    batch: '2025/2026',
    apply_url: '',
    snippet: '',
    description: '',
    is_new_today: true,
    is_early_access: false,
    is_featured: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = adminToken || localStorage.getItem('joborbit_admin_token') || 'joborbit-admin-secret-2026';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15'
      });
      if (search.trim()) params.append('q', search.trim());

      const res = await fetch(`/api/admin/jobs?${params.toString()}`, {
        headers: {
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setJobs(data.jobs || []);
        setPagination(data.pagination || { total: 0, total_pages: 1 });
      } else {
        showToast(data.message || 'Failed to fetch admin jobs', 'error');
      }
    } catch (e) {
      showToast('Network error while fetching jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, search]);

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      company: '',
      location: 'Remote / India',
      region: 'India',
      job_type: 'Full-time',
      pay: 'Competitive',
      batch: '2025/2026',
      apply_url: '',
      snippet: '',
      description: '',
      is_new_today: true,
      is_early_access: false,
      is_featured: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      company: job.company || '',
      location: job.location || 'Remote / India',
      region: job.region || 'India',
      job_type: job.job_type || 'Full-time',
      pay: job.pay || 'Competitive',
      batch: job.batch || '',
      apply_url: job.apply_url || '',
      snippet: job.snippet || '',
      description: job.description || job.snippet || '',
      is_new_today: Boolean(job.is_new_today),
      is_early_access: Boolean(job.is_early_access),
      is_featured: Boolean(job.is_featured)
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.company.trim()) {
      showToast('Job Title and Company are required.', 'error');
      return;
    }

    setSubmitting(true);
    const token = adminToken || localStorage.getItem('joborbit_admin_token') || 'joborbit-admin-secret-2026';
    const isEdit = Boolean(editingJob);
    const url = isEdit ? `/api/admin/jobs/${editingJob.id}` : '/api/admin/jobs';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToast(data.message || (isEdit ? 'Job updated!' : 'Job created!'), 'success');
        setIsModalOpen(false);
        fetchJobs();
      } else {
        showToast(data.message || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast('Server error while saving job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    const token = adminToken || localStorage.getItem('joborbit_admin_token') || 'joborbit-admin-secret-2026';
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToast(`Job ID ${jobId} successfully deleted.`, 'success');
        setDeleteConfirmId(null);
        fetchJobs();
      } else {
        showToast(data.message || 'Failed to delete job', 'error');
      }
    } catch (err) {
      showToast('Error deleting job record', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-in slide-in-from-bottom-3 duration-200 ${
          toast.type === 'success' 
            ? 'bg-emerald-950 text-emerald-200 border-emerald-800' 
            : 'bg-rose-950 text-rose-200 border-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title, company, or skills..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors cursor-pointer"
            title="Refresh jobs inventory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Job</span>
          </button>
        </div>

      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Role & Company</th>
                <th className="py-3.5 px-3">Location & Region</th>
                <th className="py-3.5 px-3">Type & Pay</th>
                <th className="py-3.5 px-3">Batches</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading jobs directory...</span>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No matching jobs found. Click <strong>+ Add New Job</strong> above to create one.
                  </td>
                </tr>
              ) : (
                jobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Role & Company */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                      <div className="text-slate-500 flex items-center gap-1 text-xs">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{job.company}</span>
                        {job.apply_url && (
                          <a href={job.apply_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
                            <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-800">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{job.location}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{job.region || 'India'}</span>
                    </td>

                    {/* Type & Pay */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        {job.job_type || 'Full-time'}
                      </span>
                      <div className="text-[11px] font-bold text-emerald-700 mt-0.5">{job.pay || 'Competitive'}</div>
                    </td>

                    {/* Batches */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {job.batch ? (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                          {job.batch}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status Badges */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {job.is_new_today && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase">
                            New Drop
                          </span>
                        )}
                        {job.is_early_access && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase">
                            VIP Early
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(job)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit job details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {deleteConfirmId === job.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-150">
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(job.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete job record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{pagination.total_pages}</strong> ({pagination.total.toLocaleString()} Total Jobs)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {editingJob ? `Edit Job #${editingJob.id}` : 'Create New Job Listing'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish or update opportunities directly into JobOrbit's active feeds.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Row 1: Title & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. SDE-1 (Backend Engineer)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Swiggy, Zepto, Google"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Row 2: Location & Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Bengaluru, India or Remote"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Region Feed
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="India">India</option>
                    <option value="Global / US">Global / US</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Job Type, Pay & Batches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Type
                  </label>
                  <select
                    value={formData.job_type}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pay / Stipend
                  </label>
                  <input
                    type="text"
                    value={formData.pay}
                    onChange={(e) => setFormData({ ...formData, pay: e.target.value })}
                    placeholder="e.g. ₹25,000 /mo or 14 LPA"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Eligible Batches
                  </label>
                  <input
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="e.g. 2025/2026/2027"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Row 4: Application URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Application Link or Direct Career Portal
                </label>
                <input
                  type="url"
                  value={formData.apply_url}
                  onChange={(e) => setFormData({ ...formData, apply_url: e.target.value })}
                  placeholder="https://company.com/careers/apply-id-1234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Row 5: Snippet & Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Job Description / Requirements
                </label>
                <textarea
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value, snippet: e.target.value.slice(0, 240) })}
                  placeholder="Paste JD bullet points, skills, responsibilities..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                ></textarea>
              </div>

              {/* Row 6: Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_new_today}
                    onChange={(e) => setFormData({ ...formData, is_new_today: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Mark as "New Drop Today"</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_early_access}
                    onChange={(e) => setFormData({ ...formData, is_early_access: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span>VIP Early Access Only</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingJob ? 'Save Changes' : '+ Publish Job'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
