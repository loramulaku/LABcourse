import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import apiFetch, { API_URL } from "../../api";

export default function LabPendingResult() {
  const [pendingResult, setPendingResult] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/pending`);
        setPendingResult(data);
      } catch (e) {
        console.error(e);
        setPendingResult([]);
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
        setPendingResult(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [location.pathname]);

  const submitResult = async (id, resultData) => {
    try {
      const formData = new FormData();
      formData.append('result_note', resultData.note);
      if (resultData.pdf) {
        formData.append('result_pdf', resultData.pdf);
      }

      await apiFetch(`${API_URL}/api/laboratories/dashboard/upload-result/${id}`, {
        method: 'POST',
        body: formData
      });
      
      // Refresh the list to show updated data
      const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/pending`);
      setPendingResult(data);
      alert('Result submitted successfully! Patient will be notified.');
    } catch (e) {
      console.error(e);
      alert('Failed to submit result. Please try again.');
    }
  };

  const filteredPendingResult = pendingResult.filter(patient =>
    patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading pending results...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pending Results</h1>
        <p className="text-gray-600">Upload results for patients awaiting their analysis results</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-4">
        {filteredPendingResult.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No pending results found</p>
          </div>
        ) : (
          filteredPendingResult.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-green-200 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 text-lg">{p.patient_name}</h3>
                  <p className="text-green-600">{p.analysis_name}</p>
                  <p className="text-sm text-gray-500">Appointment: {new Date(p.appointment_date).toLocaleString()}</p>
                  {p.patient_email && <p className="text-sm text-gray-500">Email: {p.patient_email}</p>}
                  {p.patient_phone && <p className="text-sm text-gray-500">Phone: {p.patient_phone}</p>}
                  {p.notes && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 font-medium">Patient Notes:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">{p.notes}</p>
                    </div>
                  )}
                </div>
                <div className="ml-6">
                  <PendingResultForm 
                    patientId={p.id} 
                    patientName={p.patient_name}
                    onSubmit={(resultData) => submitResult(p.id, resultData)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Component for result upload form
function PendingResultForm({ patientId, patientName, onSubmit }) {
  const [note, setNote] = useState("");
  const [pdf, setPdf] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdf) {
      alert('Please select a PDF file to upload');
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit({ note, pdf });
      setNote("");
      setPdf(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 min-w-[300px]">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Result Note (Optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any notes about the results..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Result PDF (Required)
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setPdf(e.target.files[0])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={submitting || !pdf}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit Result'}
      </button>
    </form>
  );
}
