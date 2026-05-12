import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Package, Wrench, CheckCircle, Clock, Users, UserCircle, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  SERVICE_CENTER_ASSIGNED: '#3b82f6',
  ENGINEER_ASSIGNED: '#6366f1',
  ENGINEER_VISITING: '#8b5cf6',
  BARCODE_VERIFIED: '#06b6d4',
  OTP_SENT: '#f97316',
  OTP_VERIFIED: '#14b8a6',
  INSTALLATION_COMPLETED: '#22c55e',
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#ef4444'];

const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
  >
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-3xl font-bold text-slate-900">{value ?? '—'}</p>
    </div>
  </motion.div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-100 p-6 flex items-center gap-4 animate-pulse">
    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
    <div className="space-y-2">
      <div className="h-3 w-24 bg-slate-200 rounded" />
      <div className="h-8 w-16 bg-slate-200 rounded" />
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => {
      setStats(res.data.data);
    }).catch(() => {
      console.error('Failed to fetch stats');
    }).finally(() => setLoading(false));
  }, []);

  const monthlyData = (stats?.charts?.monthlyInstallations || []).map(m => ({
    name: MONTH_NAMES[(m._id.month - 1)],
    count: m.count,
  }));

  const statusData = (stats?.charts?.statusBreakdown || []).map(s => ({
    name: s._id.replace(/_/g, ' '),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#94a3b8',
  }));

  const engineerData = (stats?.charts?.engineerWorkload || []).map(e => ({
    name: e.name,
    jobs: e.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Here's your overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(7)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {user?.role !== 'customer' && (
              <StatCard title="Total Customers" value={stats?.totalCustomers} icon={UserCircle} colorClass="bg-pink-50 text-pink-600" delay={0.05} />
            )}
            <StatCard title={user?.role === 'customer' ? "My Products" : "Total Products"} value={stats?.totalProducts} icon={Package} colorClass="bg-violet-50 text-violet-600" delay={0.1} />
            <StatCard title={user?.role === 'customer' ? "My Installations" : "Installation Requests"} value={stats?.totalInstallations} icon={Wrench} colorClass="bg-blue-50 text-blue-600" delay={0.15} />
            <StatCard title={user?.role === 'customer' ? "My Repairs" : "Repair Requests"} value={stats?.repairRequests} icon={PenTool} colorClass="bg-rose-50 text-rose-600" delay={0.2} />
            <StatCard title="Pending Jobs" value={stats?.pendingJobs} icon={Clock} colorClass="bg-amber-50 text-amber-600" delay={0.25} />
            <StatCard title="Completed Jobs" value={stats?.completedJobs} icon={CheckCircle} colorClass="bg-green-50 text-green-600" delay={0.3} />
            {(user?.role === 'super_admin' || user?.role === 'service_center') && (
              <StatCard title="Active Engineers" value={stats?.activeEngineersCount} icon={Users} colorClass="bg-purple-50 text-purple-600" delay={0.35} />
            )}
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6"
        >
          <h2 className="text-base font-semibold text-slate-900 mb-1">Monthly Installations</h2>
          <p className="text-xs text-slate-400 mb-5">Last 6 months trend</p>
          <div className="h-64">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={52} name="Installations" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"
        >
          <h2 className="text-base font-semibold text-slate-900 mb-1">Status Breakdown</h2>
          <p className="text-xs text-slate-400 mb-5">All tickets by status</p>
          <div className="h-64">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                    formatter={(val, name) => [val, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-y-1 gap-x-3">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-500">{s.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Engineer Workload Chart */}
      {(user?.role === 'super_admin' || user?.role === 'service_center') && engineerData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"
        >
          <h2 className="text-base font-semibold text-slate-900 mb-1">Engineer Workload</h2>
          <p className="text-xs text-slate-400 mb-5">Jobs assigned per engineer</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engineerData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={110} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                />
                <Bar dataKey="jobs" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={32} name="Jobs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
