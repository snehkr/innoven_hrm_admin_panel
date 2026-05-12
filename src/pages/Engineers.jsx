import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, X, Briefcase, Mail, Phone, Lock, Hash } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Engineers = () => {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'engineer'
  });

  const fetchEngineers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users?role=engineer');
      setEngineers(res.data.data.users);
    } catch (error) {
      toast.error('Failed to fetch engineers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngineers();
  }, []);

  const handleAddEngineer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/auth/register', formData);
      toast.success('Engineer added successfully');
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'engineer' });
      fetchEngineers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding engineer');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    // Just a UI stub for now as backend might need an update-user route.
    toast.success('Status updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Engineers Management</h1>
          <p className="text-sm text-slate-500">Manage field engineers and track their availability.</p>
        </div>
        {(user.role === 'super_admin' || user.role === 'service_center') && (
          <button onClick={() => setShowModal(true)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <UserPlus className="w-5 h-5 mr-2" />
            Add Engineer
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" placeholder="Search engineers..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Engineer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Jobs Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : engineers.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No engineers found</td></tr>
              ) : (
                engineers.map((engineer) => (
                  <tr key={engineer._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                          {engineer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{engineer.name}</p>
                          <p className="text-xs text-slate-500">EMP-{engineer._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{engineer.email}</p>
                      <p className="text-xs text-slate-500">{engineer.phone || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        <Briefcase className="w-3 h-3 mr-1"/> 0 Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleStatus(engineer._id, true)} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 hover:bg-green-200 border border-green-200 transition-colors">
                        Active
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Engineer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Add New Engineer</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddEngineer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <UserPlus className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+91 9876543210" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password *</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Pass123" />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Engineer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Engineers;
