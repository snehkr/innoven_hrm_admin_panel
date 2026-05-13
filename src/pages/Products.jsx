import React, { useState, useEffect } from 'react';
import { PackagePlus, Search, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import TableSkeleton from '../components/TableSkeleton';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    model_name: '',
    serial_number: '',
    warranty_period_months: 12
  });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data.products);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', formData);
      setIsModalOpen(false);
      setFormData({ model_name: '', serial_number: '', warranty_period_months: 12 });
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Manage products, serial numbers, and barcodes.</p>
        </div>
        {(user.role === 'super_admin' || user.role === 'retailer' || user.role === 'distributor') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <PackagePlus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Model Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Serial Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Warranty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registered Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {products.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">No products found.</td></tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{product.model_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-sm">{product.serial_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.barcode_image_url ? (
                          <a href={product.barcode_image_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Barcode</a>
                        ) : (
                          <span className="text-slate-400 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">{product.warranty_period_months} mo</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Add New Product</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.model_name}
                    onChange={(e) => setFormData({...formData, model_name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Samsung QLED 65"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                  <input 
                    type="text" 
                    required
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter unique SN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warranty (Months)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.warranty_period_months}
                    onChange={(e) => setFormData({...formData, warranty_period_months: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
