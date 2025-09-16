import React, { useEffect, useMemo, useState } from 'react';
import { API_URL, getAccessToken } from '../api';
import { useNavigate } from 'react-router-dom';

const DoctorRefused = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_URL}/api/appointments/doctor/refused`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: 'include',
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error('Only doctors can access this page');
          throw new Error('Failed to load data');
        }
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      String(it.patient_name || '').toLowerCase().includes(q) ||
      String(it.patient_email || '').toLowerCase().includes(q) ||
      String(it.patient_phone || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  const handleSelect = (it) => {
    setSelected(it);
  };

  const goToTherapy = (appointmentId) => {
    navigate(`/doctor/therapy/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading refused appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-center mt-8">{error}</p>;
  }

  return (
    <div className="my-10">
      <h1 className="text-3xl font-medium mb-2">Refused & Cancelled Appointments</h1>
      <p className="text-gray-600 mb-6">Only visible to doctors. Follow up or prescribe therapy.</p>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-96 border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* List */}
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Reason</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Refusals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((it) => (
                <tr key={it.appointment_id} className={selected?.appointment_id === it.appointment_id ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:underline" onClick={() => handleSelect(it)}>
                      {it.patient_name}
                    </button>
                    <div className="text-xs text-gray-500">{it.patient_email} · {it.patient_phone}</div>
                  </td>
                  <td className="px-4 py-3">{new Date(it.scheduled_for).toLocaleString()}</td>
                  <td className="px-4 py-3 truncate max-w-[220px]" title={it.reason}>{it.reason}</td>
                  <td className="px-4 py-3">{it.refusal_count}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>No refused or cancelled appointments.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail */}
        <div className="border border-gray-200 rounded-lg p-5">
          {selected ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Patient Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Name</div>
                  <div className="font-medium">{selected.patient_name}</div>
                </div>
                <div>
                  <div className="text-gray-500">Patient ID</div>
                  <div className="font-medium">{selected.patient_id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Email</div>
                  <div className="font-medium">{selected.patient_email}</div>
                </div>
                <div>
                  <div className="text-gray-500">Phone</div>
                  <div className="font-medium">{selected.patient_phone || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Appointment</div>
                  <div className="font-medium">{new Date(selected.scheduled_for).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium">{selected.status}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-gray-500">Reason for refusal</div>
                  <div className="font-medium">{selected.reason}</div>
                </div>
                {selected.notes && (
                  <div className="sm:col-span-2">
                    <div className="text-gray-500">Notes</div>
                    <div className="font-medium">{selected.notes}</div>
                  </div>
                )}
              </div>

              <hr className="my-5" />
              <div className="flex gap-3">
                <button
                  onClick={() => goToTherapy(selected.appointment_id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Prescribe Therapy/Medications
                </button>
                <button 
                  type="button" 
                  className="px-4 py-2 border rounded" 
                  onClick={() => navigate('/my-appointments')}
                >
                  Go to My Appointments
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-600">Select a patient on the left to view details and prescribe therapy.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorRefused;


