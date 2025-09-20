import React, { useEffect, useState } from "react";
import apiFetch, { API_URL } from "../../api";

export default function LabHistory() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(
          `${API_URL}/api/laboratories/dashboard/history`,
        );
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

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) return <div className="rounded-2xl border p-5">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-green-800 flex items-center">
          <img
            src="/src/lab/labicon/2.jpg"
            alt="History"
            className="w-8 h-8 mr-3"
          />
          Patient History
        </h3>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-3 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all"
        />
      </div>
      {filteredPatients.length === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-green-600 font-medium">
            {searchTerm
              ? "No patients found matching your search."
              : "No history yet."}
          </p>
        </div>
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
        const data = await apiFetch(
          `${API_URL}/api/laboratories/dashboard/history/${patient.user_id}`,
        );
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
    <div className="rounded-xl border border-green-200 bg-white shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between p-4 text-sm">
        <div>
          <p className="font-semibold text-green-800">{patient.name}</p>
          <p className="text-green-600">{patient.email}</p>
        </div>
        <button
          onClick={toggle}
          className="rounded-lg border border-green-300 px-4 py-2 hover:bg-green-50 text-green-600 font-medium transition-all"
        >
          {open ? "Hide" : "Show All History"}
        </button>
      </div>
      {open && (
        <div className="border-t border-green-200 p-4 text-sm bg-green-50">
          {loading ? (
            <p className="text-green-600 text-center">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-green-600 text-center">No previous analyses.</p>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="rounded-lg border border-green-200 bg-white p-3"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-green-800">
                      {it.analysis_name}
                    </span>
                    <span className="text-green-600">
                      {new Date(it.appointment_date).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-green-700 mt-1">
                    Status:{" "}
                    <span className="capitalize font-medium">{it.status}</span>
                  </div>
                  {it.result_note &&
                    it.result_note !== "READY_FOR_RESULT_UPLOAD" && (
                      <div className="mt-2 text-green-700">
                        Result Note: {it.result_note}
                      </div>
                    )}
                  {it.result_pdf_path && (
                    <PdfPreview
                      url={`${API_URL}/${it.result_pdf_path.replace(/^\/?/, "")}`}
                    />
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
    <div className="mt-3 flex space-x-3">
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        View PDF
      </button>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download
      </a>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-green-300">
            <div className="flex items-center justify-between p-4 border-b border-green-200 bg-gradient-to-r from-green-50 to-green-100">
              <div className="text-lg font-bold text-green-800">
                PDF Result Preview
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium transition-all shadow-sm"
              >
                Close
              </button>
            </div>
            <iframe title="PDF" src={url} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
