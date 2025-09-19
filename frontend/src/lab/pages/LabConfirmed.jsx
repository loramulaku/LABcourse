import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import apiFetch, { API_URL } from "../../api";

export default function LabConfirmed() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/confirmed`);
        setPatients(data);
      } catch (e) {
        console.error(e);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Refresh data when navigating to this page
  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/confirmed`);
        setPatients(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [location.pathname]);

  const markPendingResult = async (id) => {
    try {
      // Set a flag in result_note to indicate this patient is ready for result upload
      await apiFetch(`${API_URL}/api/laboratories/dashboard/update-status/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'pending_result',
          result_note: 'READY_FOR_RESULT_UPLOAD' // Flag to indicate this patient is in pending result state
        })
      });
      // Refresh the list to show updated data
      const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/confirmed`);
      setPatients(data);
      alert('Patient moved to Pending Result successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update patient status. Please try again.');
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="rounded-2xl border p-5">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-green-800 flex items-center">
          <img src="/src/lab/labicon/4.jpg" alt="Confirmed" className="w-8 h-8 mr-3" />
          Confirmed Patients
        </h3>
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-3 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all"
        />
      </div>
      <div className="space-y-3 text-sm">
        {filteredPatients.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-green-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex-1">
              <p className="font-semibold text-green-800">{p.patient_name}</p>
              <p className="text-green-600">{new Date(p.appointment_date).toLocaleString()}</p>
              <p className="text-gray-600 text-sm">{p.analysis_name}</p>
              {p.notes && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 font-medium">Patient Notes:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">{p.notes}</p>
                </div>
              )}
            </div>
            <button onClick={() => markPendingResult(p.id)} className="rounded-lg border border-orange-300 px-4 py-2 hover:bg-orange-50 text-orange-600 font-medium transition-all">Move to Pending Result</button>
          </div>
        ))}
      </div>
    </div>
  );
}


