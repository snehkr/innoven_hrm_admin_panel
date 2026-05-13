import React, { useState, useEffect, useCallback } from 'react';
import { UserCircle, Search, MapPin } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import TableSkeleton from '../components/TableSkeleton';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchCustomers = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?page=${page}&limit=10&search=${search}`);
      setCustomers(res.data.data.customers);
      setPagination(res.data.data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchCustomers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Customers</h1>
        <p className="text-sm text-slate-500">View and manage your registered customers.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, phone or city..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} columns={4} />
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {customers.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500 italic">No customers found matching your search.</td></tr>
                ) : (
                  customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{customer.name}</p>
                          <p className="text-xs text-slate-500">{customer.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">{customer.phone}</p>
                      {customer.alternate_phone && <p className="text-xs text-slate-500">Alt: {customer.alternate_phone}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mr-1 mt-0.5 text-slate-400 flex-shrink-0" />
                        <div>
                          <p>{customer.city}, {customer.state}</p>
                          <p className="text-xs text-slate-400 truncate w-32">{customer.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="space-x-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => fetchCustomers(pagination.page - 1, searchTerm)}
                className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchCustomers(pagination.page + 1, searchTerm)}
                className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
