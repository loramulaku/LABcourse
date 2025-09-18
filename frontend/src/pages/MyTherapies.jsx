import React, { useEffect, useState } from 'react';
import { API_URL, getAccessToken } from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const MyTherapies = () => {
  const navigate = useNavigate();
  const [therapies, setTherapies] = useState([]);
  const [stats, setStats] = useState({});
  const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTherapyData();
  }, []);

  const fetchTherapyData = async () => {
    try {
      setLoading(true);
      const [therapiesRes, statsRes, followUpsRes] = await Promise.all([
        fetch(`${API_URL}/api/therapies/patient/dashboard`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: 'include',
        }),
        fetch(`${API_URL}/api/therapies/patient/stats`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: 'include',
        }),
        fetch(`${API_URL}/api/therapies/patient/upcoming-followups`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: 'include',
        })
      ]);

      if (therapiesRes.ok) {
        const therapiesData = await therapiesRes.json();
        setTherapies(therapiesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (followUpsRes.ok) {
        const followUpsData = await followUpsRes.json();
        setUpcomingFollowUps(followUpsData);
      }
    } catch (error) {
      console.error('Error fetching therapy data:', error);
      toast.error('Failed to load therapy data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapies = therapies.filter(therapy => {
    switch (activeTab) {
      case 'active':
        return therapy.status === 'active';
      case 'completed':
        return therapy.status === 'completed';
      case 'cancelled':
        return therapy.status === 'cancelled';
      default:
        return true;
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your therapies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Therapies & Prescriptions</h1>
        <p className="text-gray-600">View your prescribed therapies and medications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Therapies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_therapies || 0}</p>
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
              <p className="text-sm font-medium text-gray-600">Active Therapies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_therapies || 0}</p>
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
              <p className="text-sm font-medium text-gray-600">Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingFollowUps.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Follow-ups */}
      {upcomingFollowUps.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4">Upcoming Follow-ups</h2>
          <div className="space-y-3">
            {upcomingFollowUps.slice(0, 3).map((followUp) => (
              <div key={followUp.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Follow-up with {followUp.doctor_speciality}</p>
                  <p className="text-sm text-gray-600">{followUp.therapy_text.substring(0, 100)}...</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-800">
                    {formatDate(followUp.follow_up_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Therapy List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Therapies</h2>
          
          {/* Tabs */}
          <div className="mt-4 flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All Therapies' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredTherapies.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No therapies found</p>
              <p className="text-sm text-gray-400 mt-2">Your doctor will prescribe therapies after your appointments</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTherapies.map((therapy) => (
                <div key={therapy.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Therapy from {therapy.doctor_speciality}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Prescribed on {formatDate(therapy.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(therapy.status)}`}>
                      {therapy.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {therapy.medications && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Medications</h4>
                        <p className="text-sm text-gray-900">{therapy.medications}</p>
                      </div>
                    )}
                    {therapy.dosage && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Dosage</h4>
                        <p className="text-sm text-gray-900">{therapy.dosage}</p>
                      </div>
                    )}
                    {therapy.frequency && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Frequency</h4>
                        <p className="text-sm text-gray-900">{therapy.frequency}</p>
                      </div>
                    )}
                    {therapy.duration && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Duration</h4>
                        <p className="text-sm text-gray-900">{therapy.duration}</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Therapy Instructions</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{therapy.therapy_text}</p>
                  </div>

                  {therapy.instructions && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Special Instructions</h4>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{therapy.instructions}</p>
                    </div>
                  )}

                  {therapy.follow_up_date && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-blue-800 mb-1">Follow-up Appointment</h4>
                      <p className="text-sm text-blue-700">
                        Scheduled for {formatDate(therapy.follow_up_date)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTherapies;
