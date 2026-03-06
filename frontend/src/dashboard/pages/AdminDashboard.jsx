import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Users, UserPlus, Calendar, DollarSign, Activity, ChevronRight } from 'lucide-react';
import apiFetch from '../../api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await apiFetch('/api/admin/dashboard/stats');
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setError(error.message || 'An error occurred while fetching statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex flex-col items-center max-w-md text-center">
          <Activity className="w-12 h-12 mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">Dashboard Error</h2>
          <p>{error || 'No data returned from server.'}</p>
          <button 
            onClick={() => { setLoading(true); setError(null); fetchDashboardStats(); }}
            className="mt-6 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // --- Charts Configuration ---

  const revenueChartOptions = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#3b82f6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { formatter: (value) => `$${value}` }
    },
    grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
  };

  const revenueSeries = [{
    name: 'Revenue',
    data: stats.charts.revenueByMonth
  }];

  const statusChartOptions = {
    chart: { type: 'donut' },
    labels: ['Pending', 'Confirmed/Approved', 'Completed', 'Cancelled/Rejected'],
    colors: ['#fbbf24', '#3b82f6', '#10b981', '#ef4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: true },
            value: { show: true, formatter: (val) => val },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              }
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom' },
    stroke: { show: false }
  };

  const statusSeries = stats.charts.appointmentsByStatus;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of hospital performance and statistics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Patients" 
          value={stats.kpis.totalPatients} 
          icon={<Users className="w-6 h-6 text-blue-600" />} 
          bgClass="bg-blue-50" 
        />
        <KPICard 
          title="Active Doctors" 
          value={stats.kpis.totalDoctors} 
          icon={<UserPlus className="w-6 h-6 text-emerald-600" />} 
          bgClass="bg-emerald-50" 
        />
        <KPICard 
          title="Total Appointments" 
          value={stats.kpis.totalAppointments} 
          subtitle={`${stats.kpis.monthlyAppointments} this month`}
          icon={<Calendar className="w-6 h-6 text-purple-600" />} 
          bgClass="bg-purple-50" 
        />
        <KPICard 
          title="Total Revenue" 
          value={`$${stats.kpis.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="w-6 h-6 text-amber-600" />} 
          bgClass="bg-amber-50" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Overview</h2>
            <div className="p-2 bg-blue-50 rounded-lg"><Activity className="w-5 h-5 text-blue-600" /></div>
          </div>
          <div className="h-72">
            <ReactApexChart options={revenueChartOptions} series={revenueSeries} type="area" height="100%" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Appointments Status</h2>
          <div className="h-72 flex justify-center items-center">
            <ReactApexChart options={statusChartOptions} series={statusSeries} type="donut" height="100%" />
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Appointments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Doctor</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {stats.recentActivity.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center">
                     <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                        {apt.User?.name?.[0] || '?'}
                     </div>
                     {apt.User?.name}
                  </td>
                  <td className="px-6 py-4">
                    Dr. {apt.Doctor?.User?.name}
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-gray-900 dark:text-white font-medium">
                       {new Date(apt.appointment_date || apt.scheduled_for).toLocaleDateString()}
                     </div>
                     <div className="text-xs text-gray-500">{new Date(apt.scheduled_for).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentActivity.length === 0 && (
                <tr>
                   <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No recent activity detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper for Status Badge
const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'CONFIRMED': case 'APPROVED': return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'PENDING': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'CANCELLED': case 'REJECTED': return 'bg-red-100 text-red-700 border border-red-200';
    default: return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};

// Helper component for KPI Cards
const KPICard = ({ title, value, subtitle, icon, bgClass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-xl ${bgClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default AdminDashboard;
