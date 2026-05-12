import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wrench, Search, UserPlus, X, CheckCircle, Clock, ChevronDown, Eye, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const STATUSES = [
  'PENDING', 'SERVICE_CENTER_ASSIGNED', 'ENGINEER_ASSIGNED',
  'ENGINEER_VISITING', 'BARCODE_VERIFIED', 'OTP_SENT', 'OTP_VERIFIED', 'INSTALLATION_COMPLETED'
];

const statusConfig = {
  PENDING: { cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  SERVICE_CENTER_ASSIGNED: { cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  ENGINEER_ASSIGNED: { cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  ENGINEER_VISITING: { cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  BARCODE_VERIFIED: { cls: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  OTP_SENT: { cls: 'bg-orange-100 text-orange-800 border-orange-200' },
  OTP_VERIFIED: { cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  INSTALLATION_COMPLETED: { cls: 'bg-green-100 text-green-800 border-green-200' },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { cls: 'bg-slate-100 text-slate-800 border-slate-200' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config.cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const SkeletonRow = () => (
  <tr>
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// Timeline Drawer
const TimelineDrawer = ({ request, onClose }) => {
  const timelineIcons = {
    PENDING: '📋',
    SERVICE_CENTER_ASSIGNED: '🏢',
    ENGINEER_ASSIGNED: '👷',
    ENGINEER_VISITING: '🚗',
    BARCODE_VERIFIED: '📷',
    OTP_SENT: '📧',
    OTP_VERIFIED: '✅',
    INSTALLATION_COMPLETED: '🎉',
  };
  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ticket Timeline</h2>
          <p className="text-sm text-slate-500 font-mono">{request?.ticket_number}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>
      <div className="p-6">
        {(request?.timeline || []).map((entry, idx, arr) => (
          <div key={idx} className="flex gap-4 relative">
            <div className="flex flex-col items-center">
              <span className="text-xl">{timelineIcons[entry.status] || '📌'}</span>
              {idx < arr.length - 1 && (
                <div className="w-0.5 bg-slate-200 flex-1 my-1" />
              )}
            </div>
            <div className="pb-6">
              <p className="font-semibold text-slate-800 text-sm">{entry.status.replace(/_/g, ' ')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{entry.note}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Assign Engineer Modal
const AssignEngineerModal = ({ request, onClose, onSuccess }) => {
  const [engineers, setEngineers] = useState([]);
  const [selectedEng, setSelectedEng] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/users?role=engineer').then(res => {
      setEngineers(res.data.data?.users || []);
    }).catch(() => {
      toast.error('Could not load engineers');
    }).finally(() => setLoading(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedEng) return toast.error('Please select an engineer');
    setSaving(true);
    try {
      await api.patch(`/installations/${request._id}/assign-engineer`, { engineer_id: selectedEng });
      toast.success('Engineer assigned successfully!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Assignment failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Assign Engineer</h2>
            <p className="text-sm text-slate-500">Ticket: <span className="font-mono">{request.ticket_number}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="h-10 bg-slate-200 rounded-lg animate-pulse" />
          ) : (
            <div className="relative">
              <select
                value={selectedEng}
                onChange={e => setSelectedEng(e.target.value)}
                className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">-- Select Engineer --</option>
                {engineers.map(eng => (
                  <option key={eng._id} value={eng._id}>{eng.name} ({eng.email})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={saving || !selectedEng}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {saving ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Proof View Modal
const ProofModal = ({ url, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      className="relative max-w-4xl w-full"
      onClick={e => e.stopPropagation()}
    >
      <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors">
        <X className="w-8 h-8" />
      </button>
      <img src={url} alt="Installation Proof" className="w-full rounded-xl shadow-2xl" />
    </motion.div>
  </motion.div>
);

const Installations = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [timelineTarget, setTimelineTarget] = useState(null);
  const [proofTarget, setProofTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const { user } = useAuth();
  const debounceRef = useRef(null);

  const fetchRequests = useCallback(async (pg = 1, q = '', st = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 10 });
      if (q) params.set('search', q);
      if (st) params.set('status', st);
      const res = await api.get(`/installations?${params}`);
      setRequests(res.data.data.requests);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load installations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(page, search, statusFilter);
  }, [page, statusFilter]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchRequests(1, val, statusFilter);
    }, 400);
  };

  const canAssign = user?.role === 'super_admin' || user?.role === 'service_center';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Installations</h1>
          <p className="text-sm text-slate-500">{pagination.total} tickets total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search + Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by ticket number..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none border border-slate-300 rounded-lg px-4 py-2 pr-8 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {['Ticket', 'Product', 'Customer', 'Status', 'Engineer', 'Actions'].map(h => (
                  <th key={h} className={`px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Wrench className="w-10 h-10 text-slate-300" />
                      <p className="text-slate-500 font-medium">No installation requests found</p>
                      <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-semibold text-slate-900">{req.ticket_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{req.product_id?.model_name || 'N/A'}</div>
                      <div className="text-xs text-slate-400 font-mono">{req.product_id?.serial_number || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{req.customer_id?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{req.customer_id?.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {req.engineer_id?.name || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setTimelineTarget(req)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {req.installation_proof_url && (
                          <button
                            onClick={() => setProofTarget(req.installation_proof_url)}
                            className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Proof"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {canAssign && req.status !== 'INSTALLATION_COMPLETED' && (
                          <button
                            onClick={() => setAssignTarget(req)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Assign Engineer
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <AnimatePresence>
        {assignTarget && (
          <AssignEngineerModal
            request={assignTarget}
            onClose={() => setAssignTarget(null)}
            onSuccess={() => fetchRequests(page, search, statusFilter)}
          />
        )}
        {timelineTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40" onClick={() => setTimelineTarget(null)} />
            <TimelineDrawer request={timelineTarget} onClose={() => setTimelineTarget(null)} />
          </>
        )}
        {proofTarget && (
          <ProofModal url={proofTarget} onClose={() => setProofTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Installations;
