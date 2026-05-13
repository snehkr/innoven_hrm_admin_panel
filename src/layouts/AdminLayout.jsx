import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Package, Wrench, Users, UserSquare2, LogOut, Menu, X, PlusCircle, UserCircle, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
        setIsCollapsed(false);
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium">Initializing Dashboard...</p>
    </div>
  </div>;
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
      <div className={`h-16 flex items-center px-6 font-bold text-xl tracking-tight border-b border-slate-800 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
        {!isCollapsed ? (
          <div className="flex items-center">
            <span className="text-blue-500 mr-2">Innoven</span> Support
          </div>
        ) : (
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">I</div>
        )}
        <button 
          className="lg:hidden text-slate-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="px-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                title={isCollapsed ? item.name : ''}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0 h-11 w-11 mx-auto' : ''}`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0 border-2 border-slate-700">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold truncate opacity-80">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        
        <button 
          onClick={logout}
          title={isCollapsed ? 'Sign Out' : ''}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 ${isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'w-full'}`}
        >
          <LogOut className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse Toggle Desktop */}
        {!isMobile && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center justify-center px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors w-full border-t border-slate-800 pt-4 mt-2`}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : (
              <div className="flex items-center">
                <Menu className="w-4 h-4 mr-2" />
                <span>Collapse</span>
              </div>
            )}
          </button>
        )}
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
          x: sidebarOpen ? 0 : (isMobile ? -280 : 0),
          width: isCollapsed ? 80 : 280
        }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="fixed lg:relative bg-slate-900 text-white flex flex-col h-full shadow-2xl z-30 overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none lg:hidden transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="lg:hidden font-bold text-xl text-slate-800 absolute left-1/2 transform -translate-x-1/2">
            <span className="text-blue-600">Innoven</span>
          </div>

          <div className="text-sm text-slate-500 hidden sm:flex items-center ml-auto">
            <div className="flex flex-col items-end mr-4">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-tighter leading-none">Logged in as</span>
              <span className="font-semibold text-slate-800 leading-tight">{user.name}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 font-bold shadow-sm">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 scroll-smooth">
          <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
