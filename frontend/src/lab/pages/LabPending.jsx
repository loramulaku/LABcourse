import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import apiFetch, { API_URL } from "../../api";

export default function LabPending() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/pending`);
        setPending(data);
      } catch (e) {
        console.error(e);
        setPending([]);
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
        const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/pending`);
        setPending(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [location.pathname]);

  const submitResult = async (id, formData) => {
    try {
      await apiFetch(`${API_URL}/api/laboratories/dashboard/submit-result/${id}`, {
        method: 'POST',
        body: formData,
      });
      setPending((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPending = pending.filter(item =>
    item.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="rounded-2xl border p-5">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-green-800 flex items-center">
          <img src="/src/lab/labicon/7.jpg" alt="Pending" className="w-8 h-8 mr-3" />
          Pending Patients
        </h3>
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-3 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all"
        />
      </div>
      <div className="space-y-4 text-sm">
        {filteredPending.map((p) => (
          <LabPendingItem key={p.id} item={p} onSubmit={submitResult} />
        ))}
      </div>
    </div>
  );
}

function LabPendingItem({ item, onSubmit }) {
  const [result, setResult] = useState("");
  const [pdf, setPdf] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('result', result);
    if (pdf) fd.append('report', pdf);
    onSubmit(item.id, fd);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-green-800">{item.patient_name} • {new Date(item.appointment_date).toLocaleString()}</p>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-800 font-medium border border-yellow-300">Pending</span>
      </div>
      <p className="text-green-600 mb-4 font-medium">{item.analysis_name}</p>
      <textarea className="w-full rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 mb-3 transition-all" rows={3} placeholder="Result notes" value={result} onChange={(e) => setResult(e.target.value)} />
      <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} className="mb-4 p-2 border border-green-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" />
      <div className="flex justify-end">
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl">Submit Result</button>
      </div>
    </form>
  );
}


