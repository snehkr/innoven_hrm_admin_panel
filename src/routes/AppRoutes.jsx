import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Installations from '../pages/Installations';
import Engineers from '../pages/Engineers';
import Customers from '../pages/Customers';
import NewRequest from '../pages/NewRequest';
import ServiceRequests from '../pages/ServiceRequests';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Admin Routes */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="installations" element={<Installations />} />
        <Route path="service-requests" element={<ServiceRequests />} />
        <Route path="new-request" element={<NewRequest />} />
        <Route path="engineers" element={<Engineers />} />
        <Route path="customers" element={<Customers />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
