import React, { useState, useEffect } from 'react';
import apiFetch, { API_URL } from '../api';
import { Building2, BedDouble, DoorOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const statusConfig = {
  Admitted: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
  Active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  TransferRequested: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
  DischargeRequested: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle },
  Discharged: { bg: 'bg-gray-100', text: 'text-gray-600', icon: CheckCircle },
};

const MyAccommodations = () => {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAccommodations = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`${API_URL}/api/patients/my-accommodations`);
        setAccommodations(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error('Error loading accommodations:', err);
        setError('Failed to load accommodations');
      } finally {
        setLoading(false);
      }
    };
    loadAccommodations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          My Accommodations
        </h1>
        <p className="text-gray-600 mt-2">View your current and past hospital accommodations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {accommodations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Accommodations</h3>
          <p className="text-gray-500">You don't have any accommodation records yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accommodations.map((acc) => {
            const config = statusConfig[acc.status] || statusConfig.Admitted;
            const StatusIcon = config.icon;

            return (
              <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {acc.ward_name || 'Ward'} — {acc.room_number || 'Room'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Admission #{acc.id}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                    <StatusIcon className="w-4 h-4" />
                    {acc.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Ward</p>
                      <p className="text-sm font-medium text-gray-900">{acc.ward_name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DoorOpen className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Room</p>
                      <p className="text-sm font-medium text-gray-900">{acc.room_number || 'N/A'} ({acc.room_type || 'Standard'})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BedDouble className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Bed</p>
                      <p className="text-sm font-medium text-gray-900">Bed {acc.bed_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {(acc.diagnosis || acc.admitted_at) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {acc.diagnosis && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Diagnosis</p>
                        <p className="text-sm text-gray-800">{acc.diagnosis}</p>
                      </div>
                    )}
                    {acc.admitted_at && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Admitted</p>
                        <p className="text-sm text-gray-800">{new Date(acc.admitted_at).toLocaleDateString()}</p>
                      </div>
                    )}
                    {acc.discharged_at && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Discharged</p>
                        <p className="text-sm text-gray-800">{new Date(acc.discharged_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAccommodations;
