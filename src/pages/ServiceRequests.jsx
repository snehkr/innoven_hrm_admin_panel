import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Search, Eye, Filter, UserCheck, X, Image as ImageIcon, Wrench, Clock, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Timeline Drawer
const TimelineDrawer = ({ request, onClose }) => {
  const timelineIcons = {
    PENDING: '📋',
    SERVICE_CENTER_ASSIGNED: '🏢',
    ENGINEER_ASSIGNED: '👷',
    IN_PROGRESS: '⚙️',
    COMPLETED: '✅',
    CANCELLED: '❌',
  };
  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Request Timeline</h2>
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
      <img src={url} alt="Service Proof" className="w-full rounded-xl shadow-2xl" />
    </motion.div>
  </motion.div>
);

const ServiceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [engineers, setEngineers] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null);
  const [timelineTarget, setTimelineTarget] = useState(null);
  const [proofTarget, setProofTarget] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const { user } = useAuth();

  const fetchRequests = useCallback(async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/service-requests?page=${page}&limit=10&search=${search}&status=${status}`);
      setRequests(res.data.data.requests);
      setPagination(res.data.data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEngineers = async () => {
    try {
      const res = await api.get('/auth/users?role=engineer');
      setEngineers(res.data.data.users);
    } catch (error) {
      console.error('Failed to fetch engineers');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequests(1, searchTerm, statusFilter);
    }, 500);
    if (user.role === 'super_admin' || user.role === 'service_center') {
      fetchEngineers();
    }
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, fetchRequests, user.role]);

  const handleAssignEngineer = async (engineerId) => {
    try {
      setAssigning(true);
      await api.patch(`/service-requests/${assignTarget._id}/status`, {
        assigned_engineer: engineerId,
        status: 'ENGINEER_ASSIGNED',
        note: 'Engineer assigned to service request'
      });
      toast.success('Engineer assigned successfully');
      setAssignTarget(null);
      fetchRequests(pagination.page, searchTerm, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign engineer');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'SERVICE_CENTER_ASSIGNED': 'bg-blue-100 text-blue-800 border-blue-200',
      'ENGINEER_ASSIGNED': 'bg-purple-100 text-purple-800 border-purple-200',
      'IN_PROGRESS': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200'
    };
    return (
      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${styles[status] || 'bg-slate-100 text-slate-800'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getRequestTypeBadge = (type) => {
    const styles = {
      'installation': 'bg-blue-50 text-blue-700',
      'repair': 'bg-rose-50 text-rose-700',
      'service_visit': 'bg-orange-50 text-orange-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${styles[type] || 'bg-slate-100'}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Requests</h1>
        <p className="text-sm text-slate-500">Track and manage all installations, repairs, and service visits.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search ticket number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ENGINEER_ASSIGNED">Engineer Assigned</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ticket Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Engineer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No requests found</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{req.ticket_number}</p>
                      <div className="mt-1">{getRequestTypeBadge(req.request_type)}</div>
                      <p className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{req.customer_id?.name || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{req.customer_id?.email}</p>
                      <p className="text-xs text-slate-500">{req.customer_id?.phone}</p>
                      <p className="text-xs text-slate-400">{req.customer_id?.city}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{req.product_id?.model_name || 'N/A'}</p>
                      <p className="text-xs text-slate-500 font-mono">{req.product_id?.serial_number}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4">
                      {req.assigned_engineer ? (
                        <p className="text-sm font-medium text-slate-900">{req.assigned_engineer.name}</p>
                      ) : (
                        (user.role === 'super_admin' || user.role === 'service_center') ? (
                          <button 
                            onClick={() => setAssignTarget(req)}
                            className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100 transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            Assign
                          </button>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Unassigned</p>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.proof_image_url && (
                          <button
                            onClick={() => setProofTarget(req.proof_image_url)}
                            className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Proof"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setTimelineTarget(req)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="View Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
          <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
            <span>Page {pagination.page} of {pagination.pages}</span>
            <div className="space-x-2">
              <button disabled={pagination.page === 1} onClick={() => fetchRequests(pagination.page - 1, searchTerm, statusFilter)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <button disabled={pagination.page === pagination.pages} onClick={() => fetchRequests(pagination.page + 1, searchTerm, statusFilter)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
      {/* Assign Engineer Modal */}
      {assignTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Assign Engineer</h3>
              <button onClick={() => setAssignTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">Select an engineer to handle ticket <span className="font-mono font-bold text-slate-900">{assignTarget.ticket_number}</span>.</p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {engineers.length === 0 ? (
                  <p className="text-center py-4 text-slate-500 italic">No engineers available</p>
                ) : (
                  engineers.map(engineer => (
                    <button
                      key={engineer._id}
                      disabled={assigning}
                      onClick={() => handleAssignEngineer(engineer._id)}
                      className="w-full flex items-center p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {engineer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-blue-700">{engineer.name}</p>
                        <p className="text-xs text-slate-500">{engineer.email}</p>
                      </div>
                      <UserCheck className="w-5 h-5 ml-auto text-slate-300 group-hover:text-blue-500" />
                    </button>
                  ))
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setAssignTarget(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <AnimatePresence>
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

export default ServiceRequests;
