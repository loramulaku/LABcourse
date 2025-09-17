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

  const markPending = async (id) => {
    try {
      await apiFetch(`${API_URL}/api/laboratories/dashboard/unconfirm/${id}`, { method: 'POST' });
      setPatients((prev) => prev.filter((p) => p.id !== id));
      alert('Patient moved back to pending successfully!');
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Confirmed Patients</h3>
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="space-y-3 text-sm">
        {filteredPatients.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="font-medium">{p.patient_name}</p>
              <p className="text-gray-600">{new Date(p.appointment_date).toLocaleString()}</p>
            </div>
            <button onClick={() => markPending(p.id)} className="rounded border px-3 py-1 hover:bg-gray-50">Set to Pending</button>
          </div>
        ))}
      </div>
    </div>
  );
}


