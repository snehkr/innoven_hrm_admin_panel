import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, PackagePlus, Wrench, CheckCircle, ChevronRight, AlertCircle, RefreshCw, Search, PlusCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const NewRequest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', alternate_phone: '', address: '', city: '', state: '', pincode: '' });
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
  };
  const [product, setProduct] = useState({ model_name: '', brand: '', serial_number: '', warranty_period_months: 12, invoice_number: '', purchase_date: '' });
  const [request, setRequest] = useState({ request_type: 'installation', issue_type: '', issue_description: '', urgency: 'medium' });

  // Store IDs after creation
  const [createdIds, setCreatedIds] = useState({ customerId: null, productId: null, ticketNumber: null, barcodeUrl: null });

  // Search/Selection State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);

  const [productMode, setProductMode] = useState('new'); // 'new' or 'existing'
  const [existingProducts, setExistingProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const [globalProductSearch, setGlobalProductSearch] = useState('');
  const [globalProductResults, setGlobalProductResults] = useState([]);
  const [isSearchingGlobalProduct, setIsSearchingGlobalProduct] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const handleCustomerSearch = async (val) => {
    setCustomerSearch(val);
    if (val.length < 3) {
      setCustomerSearchResults([]);
      return;
    }
    try {
      setIsSearchingCustomer(true);
      const res = await api.get(`/customers?search=${val}`);
      setCustomerSearchResults(res.data.data.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const selectCustomer = (c) => {
    setCustomer({
      name: c.name,
      phone: c.phone,
      email: c.email,
      alternate_phone: c.alternate_phone || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      pincode: c.pincode || ''
    });
    setCreatedIds(prev => ({ ...prev, customerId: c._id }));
    setIsExistingCustomer(true);
    setCustomerSearchResults([]);
    setCustomerSearch('');
    toast.success('Existing customer selected');
  };

  const fetchCustomerProducts = async (cid) => {
    try {
      setIsLoadingProducts(true);
      const res = await api.get(`/products?customer_ref=${cid}`);
      setExistingProducts(res.data.data.products);
      if (res.data.data.products.length === 0) {
        setShowGlobalSearch(true);
      } else {
        setShowGlobalSearch(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch customer products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleGlobalProductSearch = async (val) => {
    setGlobalProductSearch(val);
    if (val.length < 3) {
      setGlobalProductResults([]);
      return;
    }
    try {
      setIsSearchingGlobalProduct(true);
      const res = await api.get(`/products?search=${val}`);
      setGlobalProductResults(res.data.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingGlobalProduct(false);
    }
  };

  const assignGlobalProduct = async (p) => {
    try {
      setLoading(true);
      await api.patch(`/products/${p._id}/assign-customer`, { 
        customer_ref: createdIds.customerId 
      });
      toast.success('Product assigned to customer');
      handleExistingProductSelect(p);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error assigning product');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.phone) return toast.error('Name and Phone are required');
    if (!customer.email || !validateEmail(customer.email)) {
      setEmailError('A valid email address is required for OTP verification');
      return toast.error('A valid email address is required');
    }
    
    try {
      setLoading(true);
      const res = await api.post('/customers', customer);
      setCreatedIds(prev => ({ ...prev, customerId: res.data.data.customer._id }));
      toast.success('Customer saved');
      await fetchCustomerProducts(res.data.data.customer._id);
      nextStep();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving customer');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!product.model_name || !product.serial_number) return toast.error('Model and Serial Number required');
    try {
      setLoading(true);
      const payload = { ...product, customer_ref: createdIds.customerId };
      const res = await api.post('/products', payload);
      setCreatedIds(prev => ({ 
        ...prev, 
        productId: res.data.data.product._id,
        barcodeUrl: res.data.data.product.barcode_image_url
      }));
      toast.success('Product added successfully');
      nextStep();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding product');
    } finally {
      setLoading(false);
    }
  };

  const handleExistingProductSelect = (p) => {
    setProduct({
      model_name: p.model_name,
      brand: p.brand || '',
      serial_number: p.serial_number,
      warranty_period_months: p.warranty_period_months,
      invoice_number: p.invoice_number || '',
      purchase_date: p.purchase_date ? p.purchase_date.split('T')[0] : ''
    });
    setCreatedIds(prev => ({ 
      ...prev, 
      productId: p._id,
      barcodeUrl: p.barcode_image_url
    }));
    toast.success('Product selected');
    nextStep();
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        customer_id: createdIds.customerId,
        product_id: createdIds.productId,
        request_type: request.request_type,
        issue_type: request.issue_type,
        issue_description: request.issue_description,
        urgency: request.urgency
      };
      
      // If it's an installation, use the old endpoint for backward compatibility, else new one
      const endpoint = request.request_type === 'installation' ? '/installations' : '/service-requests';
      const res = await api.post(endpoint, payload);
      
      setCreatedIds(prev => ({ 
        ...prev, 
        ticketNumber: res.data.data.request?.ticket_number || res.data.data.serviceRequest?.ticket_number 
      }));
      toast.success('Request generated successfully!');
      nextStep();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating request');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Customer Details', icon: UserPlus },
    { num: 2, title: 'Product Details', icon: PackagePlus },
    { num: 3, title: 'Request Type', icon: Wrench },
    { num: 4, title: 'Complete', icon: CheckCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Service Request</h1>
        <p className="text-sm text-slate-500">Complete the workflow to register a customer, product, and ticket.</p>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col items-center relative flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold z-10 transition-colors ${
                step === s.num ? 'bg-blue-600 text-white shadow-md shadow-blue-200' :
                step > s.num ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s.num ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <p className={`mt-2 text-xs font-medium ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>{s.title}</p>
              
              {i < steps.length - 1 && (
                <div className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 ${
                  step > s.num ? 'bg-green-500' : 'bg-slate-100'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Forms */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-blue-500"/> Customer Information</h2>
              
              {!isExistingCustomer && (
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search existing customer..." 
                    value={customerSearch}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {customerSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                      {customerSearchResults.map(c => (
                        <button 
                          key={c._id}
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.phone} • {c.city || 'No City'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {isSearchingCustomer && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
              )}

              {isExistingCustomer && (
                <button 
                  onClick={() => {
                    setIsExistingCustomer(false);
                    setCreatedIds(prev => ({ ...prev, customerId: null }));
                    setCustomer({ name: '', phone: '', email: '', alternate_phone: '', address: '', city: '', state: '', pincode: '' });
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <PlusCircle className="w-3 h-3 mr-1" /> Register New Customer
                </button>
              )}
            </div>

            <form onSubmit={handleCustomerSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input required type="text" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                <input required type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input 
                  required 
                  type="email" 
                  value={customer.email} 
                  onChange={e => {
                    setCustomer({...customer, email: e.target.value});
                    if (e.target.value && !validateEmail(e.target.value)) {
                      setEmailError('Invalid email format');
                    } else {
                      setEmailError('');
                    }
                  }} 
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${emailError ? 'border-red-500 focus:ring-red-500' : (customer.email && !emailError ? 'border-green-500' : 'border-slate-300')}`} 
                />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                {!emailError && customer.email && <p className="text-xs text-green-600 mt-1 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Valid email</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alternate Phone</label>
                <input type="tel" value={customer.alternate_phone} onChange={e => setCustomer({...customer, alternate_phone: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
                <input type="text" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input type="text" value={customer.city} onChange={e => setCustomer({...customer, city: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <input type="text" value={customer.state} onChange={e => setCustomer({...customer, state: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                type={isExistingCustomer ? "button" : "submit"} 
                onClick={isExistingCustomer ? async () => {
                  await fetchCustomerProducts(createdIds.customerId);
                  nextStep();
                } : undefined}
                disabled={loading} 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : (isExistingCustomer ? 'Continue' : 'Save & Continue')}
                {!loading && <ChevronRight className="w-4 h-4 ml-1" />}
              </button>
            </div>
          </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center"><PackagePlus className="w-5 h-5 mr-2 text-blue-500"/> Product Details</h2>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button 
                    onClick={() => setProductMode('new')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${productMode === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Add New
                  </button>
                  <button 
                    onClick={() => setProductMode('existing')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${productMode === 'existing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Select Existing
                  </button>
                </div>
             </div>

             {productMode === 'new' ? (
               <form onSubmit={handleProductSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Model Name *</label>
                    <input required type="text" value={product.model_name} onChange={e => setProduct({...product, model_name: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                    <input type="text" value={product.brand} onChange={e => setProduct({...product, brand: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number *</label>
                    <input required type="text" value={product.serial_number} onChange={e => setProduct({...product, serial_number: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Warranty (Months)</label>
                    <input type="number" min="0" value={product.warranty_period_months} onChange={e => setProduct({...product, warranty_period_months: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
                    <input type="text" value={product.invoice_number} onChange={e => setProduct({...product, invoice_number: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                    <input type="date" value={product.purchase_date} onChange={e => setProduct({...product, purchase_date: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <button type="button" onClick={prevStep} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Back</button>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center disabled:opacity-50">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Register Product'}
                  </button>
                </div>
              </form>
             ) : (
               <div className="space-y-6">
                  {isLoadingProducts ? (
                    <div className="py-12 text-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Fetching products...</p>
                    </div>
                  ) : (
                    <>
                      {existingProducts.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {existingProducts.map(p => (
                            <div 
                              key={p._id}
                              onClick={() => handleExistingProductSelect(p)}
                              className="group border border-slate-200 rounded-xl p-4 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all relative overflow-hidden"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-slate-900">{p.model_name}</h4>
                                  <p className="text-xs text-slate-500">{p.brand || 'No Brand'}</p>
                                </div>
                                <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{p.serial_number}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{p.warranty_period_months} Mo Warranty</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(existingProducts.length === 0 || showGlobalSearch) && (
                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          {existingProducts.length === 0 && !showGlobalSearch ? (
                            <div className="text-center py-4">
                              <PackagePlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-slate-900 font-bold">No products found</p>
                              <p className="text-slate-500 text-sm mb-4">This customer has no products registered yet.</p>
                              <div className="flex justify-center gap-4">
                                <button onClick={() => setProductMode('new')} className="text-blue-600 font-bold text-sm">Register new product</button>
                                <span className="text-slate-300">|</span>
                                <button onClick={() => setShowGlobalSearch(true)} className="text-slate-600 font-bold text-sm">Search from all products</button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800">Search All Products</h3>
                                <button onClick={() => setShowGlobalSearch(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
                              </div>
                              <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                  type="text" 
                                  placeholder="Search by model name or serial number..." 
                                  value={globalProductSearch}
                                  onChange={(e) => handleGlobalProductSearch(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                                />
                                {isSearchingGlobalProduct && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                                {globalProductResults.map(p => (
                                  <div 
                                    key={p._id}
                                    className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-500 transition-all shadow-sm"
                                  >
                                    <div>
                                      <p className="font-bold text-slate-900 text-sm">{p.model_name}</p>
                                      <p className="text-xs text-slate-500">{p.serial_number} • {p.brand || 'No Brand'}</p>
                                    </div>
                                    <button 
                                      onClick={() => assignGlobalProduct(p)}
                                      disabled={loading}
                                      className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-md hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                                    >
                                      {loading ? 'Assigning...' : 'Select & Register'}
                                    </button>
                                  </div>
                                ))}
                                {globalProductSearch.length >= 3 && globalProductResults.length === 0 && !isSearchingGlobalProduct && (
                                  <div className="text-center py-4 text-slate-500 text-sm">
                                    No products matching "{globalProductSearch}"
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <div className="mt-6 flex justify-start">
                    <button type="button" onClick={prevStep} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Back</button>
                  </div>
               </div>
             )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleRequestSubmit}>
             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Wrench className="w-5 h-5 mr-2 text-blue-500"/> Request Type</h2>
             
             {createdIds.barcodeUrl && (
               <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start">
                 <AlertCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                 <div>
                   <h4 className="text-sm font-bold text-blue-900">Product Registered Successfully!</h4>
                   <p className="text-xs text-blue-700 mt-1">Barcode generated. Ensure barcode is applied before engineer visit.</p>
                   <img src={createdIds.barcodeUrl} alt="Barcode" className="h-12 mt-2 bg-white p-1 rounded border" />
                 </div>
               </div>
             )}

             <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Request Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['installation', 'repair', 'service_visit'].map(type => (
                    <label key={type} className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center text-center transition-all ${
                      request.request_type === type ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input type="radio" name="req_type" value={type} checked={request.request_type === type} onChange={() => setRequest({...request, request_type: type})} className="sr-only" />
                      <span className="font-medium text-slate-900 capitalize mt-1">{type.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {request.request_type !== 'installation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border border-slate-100 rounded-lg bg-slate-50">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Issue Category</label>
                    <select value={request.issue_type} onChange={e => setRequest({...request, issue_type: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">Select Category...</option>
                      <option value="no_power">No Power</option>
                      <option value="display_issue">Display Issue</option>
                      <option value="sound_issue">Sound Issue</option>
                      <option value="physical_damage">Physical Damage</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                    <select value={request.urgency} onChange={e => setRequest({...request, urgency: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea rows="3" value={request.issue_description} onChange={e => setRequest({...request, issue_description: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Describe the problem..."></textarea>
                  </div>
                </div>
              )}
             </div>

            <div className="mt-6 flex justify-between">
              <button type="button" onClick={prevStep} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Back</button>
              <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center disabled:opacity-50">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Generate Request'}
              </button>
            </div>
          </motion.form>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Workflow Completed!</h2>
            <p className="text-slate-500 mb-6">The request has been assigned to the service center.</p>
            
            <div className="inline-flex flex-col p-4 bg-slate-50 rounded-lg border border-slate-200 text-left mb-8 max-w-sm w-full mx-auto">
              <div className="flex justify-between mb-2">
                <span className="text-slate-500 text-sm">Ticket Number</span>
                <span className="font-bold text-slate-900">{createdIds.ticketNumber}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500 text-sm">Customer</span>
                <span className="font-medium text-slate-900">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Product</span>
                <span className="font-medium text-slate-900">{product.model_name}</span>
              </div>
            </div>

            <div>
              <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NewRequest;
