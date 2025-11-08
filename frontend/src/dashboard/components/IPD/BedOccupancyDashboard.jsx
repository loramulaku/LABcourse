import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../api';
import { Activity, Bed, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';

export default function BedOccupancyDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/bed-occupancy-stats`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        toast.error('Failed to fetch occupancy stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error fetching stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl p-8">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  // Safe defaults
  const overall = stats.overall || {
    total_beds: 0,
    total_occupied: 0,
    total_available: 0,
    overall_occupancy_rate: 0,
  };
  const wards = stats.wards || [];
  const currentPatientCount = stats.current_patient_count || 0;

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Bed Occupancy Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-6 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Beds</p>
                <p className="text-3xl font-bold text-blue-600">{overall.total_beds}</p>
              </div>
              <Bed className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 p-6 rounded-xl shadow-lg border border-red-200 dark:border-red-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Occupied</p>
                <p className="text-3xl font-bold text-red-600">{overall.total_occupied}</p>
              </div>
              <Activity className="w-12 h-12 text-red-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-3xl font-bold text-green-600">{overall.total_available}</p>
              </div>
              <Bed className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-6 rounded-xl shadow-lg border border-purple-200 dark:border-purple-700/50 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Occupancy Rate</p>
                <p className="text-3xl font-bold text-purple-600">{overall.overall_occupancy_rate}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Patients */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 p-6 rounded-xl shadow-lg border border-indigo-200 dark:border-indigo-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current IPD Patients</p>
            <p className="text-3xl font-bold text-indigo-600">{currentPatientCount}</p>
          </div>
          <Activity className="w-12 h-12 text-indigo-400" />
        </div>
      </div>

      {/* Ward-wise Statistics */}
      <div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Ward-wise Occupancy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wards.map((ward) => (
            <div key={ward.ward_id} className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{ward.ward_name}</h4>
                {ward.alert === 'critical' && (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                {ward.alert === 'warning' && (
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xl font-bold text-gray-900">{ward.total_beds}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <div className="text-xl font-bold text-red-600">{ward.occupied_beds}</div>
                  <div className="text-xs text-gray-600">Occupied</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-xl font-bold text-green-600">{ward.available_beds}</div>
                  <div className="text-xs text-gray-600">Available</div>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Occupancy Rate</span>
                  <span className="font-semibold">{ward.occupancy_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      ward.alert === 'critical'
                        ? 'bg-red-600'
                        : ward.alert === 'warning'
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${ward.occupancy_rate}%` }}
                  />
                </div>
              </div>

              {ward.alert === 'critical' && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ Critical: Over 90% occupied
                </div>
              )}
              {ward.alert === 'warning' && (
                <div className="mt-3 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  ⚠️ Warning: Over 75% occupied
                </div>
              )}
            </div>
          ))}
        </div>

        {wards.length === 0 && (
          <div className="text-center py-8 text-gray-500">No wards available. Create wards, rooms, and beds to see statistics.</div>
        )}
      </div>
    </div>
  );
}
