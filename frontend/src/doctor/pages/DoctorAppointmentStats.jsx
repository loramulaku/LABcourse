import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, getAccessToken } from "../../api";
import { toast } from "react-toastify";
import PageMeta from "../../dashboard/components/common/PageMeta";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";

const DoctorAppointmentStats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    acceptedAppointments: 0,
    declinedAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    monthlyStats: [],
    weeklyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month"); // week, month, year

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/appointments/stats?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error("Failed to load appointment statistics");
      }
    } catch (error) {
      console.error("Error fetching appointment stats:", error);
      toast.error("Error loading appointment statistics");
    } finally {
      setLoading(false);
    }
  };

  const getAcceptanceRate = () => {
    const total = stats.acceptedAppointments + stats.declinedAppointments;
    if (total === 0) return 0;
    return ((stats.acceptedAppointments / total) * 100).toFixed(1);
  };

  const getCompletionRate = () => {
    const total = stats.totalAppointments;
    if (total === 0) return 0;
    return ((stats.completedAppointments / total) * 100).toFixed(1);
  };

  const getNoShowRate = () => {
    const total = stats.totalAppointments;
    if (total === 0) return 0;
    return ((stats.noShowAppointments / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Appointment Statistics" description="View appointment statistics and analytics" />
      <PageBreadcrumb pageTitle="Appointment Statistics" />

      <div className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Statistics</h1>
              <p className="text-gray-600">Analytics and insights for your appointment management</p>
            </div>
            <div className="flex gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button
                onClick={() => navigate("/doctor/appointments")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Appointments
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.acceptedAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Declined</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.declinedAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingAppointments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Completed</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.completedAppointments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Pending</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.pendingAppointments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Cancelled</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.cancelledAppointments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">No Show</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.noShowAppointments}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Acceptance Rate</span>
                  <span className="text-sm font-medium text-gray-900">{getAcceptanceRate()}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Completion Rate</span>
                  <span className="text-sm font-medium text-gray-900">{getCompletionRate()}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">No-Show Rate</span>
                  <span className="text-sm font-medium text-gray-900">{getNoShowRate()}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Average per Day</span>
                  <span className="text-sm font-medium text-gray-900">
                    {timeRange === "week" 
                      ? (stats.totalAppointments / 7).toFixed(1)
                      : timeRange === "month"
                      ? (stats.totalAppointments / 30).toFixed(1)
                      : (stats.totalAppointments / 365).toFixed(1)
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Time-based Charts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Appointments Over Time ({timeRange === "week" ? "This Week" : timeRange === "month" ? "This Month" : "This Year"})
            </h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500">Chart visualization would be implemented here</p>
                <p className="text-sm text-gray-400">Data points: {stats.monthlyStats?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorAppointmentStats;
