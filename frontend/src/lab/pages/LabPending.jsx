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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pending Patients</h3>
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    <form onSubmit={handleSubmit} className="rounded border p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium">{item.patient_name} • {new Date(item.appointment_date).toLocaleString()}</p>
        <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-800">Pending</span>
      </div>
      <p className="text-gray-600 mb-3">{item.analysis_name}</p>
      <textarea className="w-full rounded border p-2 mb-2" rows={3} placeholder="Result notes" value={result} onChange={(e) => setResult(e.target.value)} />
      <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} className="mb-3" />
      <div className="flex justify-end">
        <button type="submit" className="rounded border px-3 py-1 hover:bg-gray-50">Submit Result</button>
      </div>
    </form>
  );
}


