import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Package, Wrench, Users, UserSquare2, LogOut, Menu, X, PlusCircle, UserCircle, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Installations', href: '/installations', icon: Wrench, roles: ['super_admin', 'service_center', 'engineer'] },
    { name: 'Service Requests', href: '/service-requests', icon: ClipboardList, roles: ['super_admin', 'retailer', 'service_center'] },
    { name: 'New Request', href: '/new-request', icon: PlusCircle, roles: ['super_admin', 'retailer'] },
    { name: 'Engineers', href: '/engineers', icon: Users, roles: ['super_admin', 'service_center'] },
    { name: 'My Customers', href: '/customers', icon: UserCircle, roles: ['super_admin', 'retailer'] },
  ];

  const filteredNav = navigation.filter(item => !item.roles || item.roles.includes(user.role));

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 font-bold text-xl tracking-tight border-b border-slate-800 justify-between">
        <div className="flex items-center">
          <span className="text-blue-500 mr-2">Innoven</span> Support
        </div>
        <button 
          className="lg:hidden text-slate-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-400 capitalize truncate">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : -256,
          width: 256
        }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className="fixed lg:relative bg-slate-900 text-white flex flex-col h-full shadow-xl z-30"
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="lg:hidden font-bold text-lg text-slate-800 absolute left-1/2 transform -translate-x-1/2">
            <span className="text-blue-600">Innoven</span> Support
          </div>

          <div className="text-sm text-slate-500 hidden sm:block ml-auto">
            Welcome back, <span className="font-semibold text-slate-700">{user.name}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
