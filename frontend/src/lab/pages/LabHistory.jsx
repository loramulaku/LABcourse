import React, { useEffect, useState } from "react";
import apiFetch, { API_URL } from "../../api";

export default function LabHistory() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/history`);
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

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="rounded-2xl border p-5">Loading...</div>;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Patient History</h3>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {filteredPatients.length === 0 ? (
        <p className="text-sm text-gray-600">
          {searchTerm ? "No patients found matching your search." : "No history yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map((p) => (
            <PatientHistoryRow key={p.user_id} patient={p} />
          ))}
        </div>
      )}
    </div>
  );
}


function PatientHistoryRow({ patient }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open) {
      setLoading(true);
      try {
        const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/history/${patient.user_id}`);
        setItems(data || []);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    setOpen(!open);
  };

  return (
    <div className="rounded border">
      <div className="flex items-center justify-between p-3 text-sm">
        <div>
          <p className="font-medium">{patient.name}</p>
          <p className="text-gray-600">{patient.email}</p>
        </div>
        <button onClick={toggle} className="rounded border px-3 py-1 hover:bg-gray-50">{open ? 'Hide' : 'Show All History'}</button>
      </div>
      {open && (
        <div className="border-t p-3 text-sm">
          {loading ? (
            <p>Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600">No previous analyses.</p>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="rounded border p-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{it.analysis_name}</span>
                    <span className="text-gray-600">{new Date(it.appointment_date).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-700">Status: <span className="capitalize">{it.status}</span></div>
                  {it.result && (
                    <div className="mt-1 text-gray-700">Result: {it.result}</div>
                  )}
                  {it.report_path && (
                    <PdfPreview url={`${API_URL}/${it.report_path.replace(/^\/?/, '')}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PdfPreview({ url }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(true)} className="text-blue-600 hover:underline">Open PDF</button>
      <a href={url} target="_blank" rel="noreferrer" className="ml-3 text-gray-700 hover:underline">Download</a>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl h-[80vh] bg-white rounded shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b">
              <div className="text-sm font-medium">PDF Preview</div>
              <button onClick={() => setOpen(false)} className="rounded px-2 py-1 text-sm hover:bg-gray-100">Close</button>
            </div>
            <iframe title="PDF" src={url} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}


