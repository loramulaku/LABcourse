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
            <div>
              <p className="font-semibold text-green-800">{p.patient_name}</p>
              <p className="text-green-600">{new Date(p.appointment_date).toLocaleString()}</p>
            </div>
            <button onClick={() => markPending(p.id)} className="rounded-lg border border-orange-300 px-4 py-2 hover:bg-orange-50 text-orange-600 font-medium transition-all">Set to Pending</button>
          </div>
        ))}
      </div>
    </div>
  );
}


