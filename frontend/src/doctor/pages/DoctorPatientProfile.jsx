import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL, getAccessToken } from "../../api";
import { toast } from "react-toastify";
import PageMeta from "../../dashboard/components/common/PageMeta";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";

const DoctorPatientProfile = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [activeTherapies, setActiveTherapies] = useState([]);
  const [privateNotes, setPrivateNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [newNoteType, setNewNoteType] = useState("general");

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [patientRes, historyRes, therapiesRes, notesRes, docsRes] = await Promise.all([
        fetch(`${API_URL}/api/doctor/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/api/doctor/patients/${patientId}/medical-history`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/api/doctor/patients/${patientId}/active-therapies`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/api/doctor/patients/${patientId}/private-notes`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/api/doctor/patients/${patientId}/documents`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
      ]);

      if (patientRes.ok) {
        const patientData = await patientRes.json();
        setPatient(patientData);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setMedicalHistory(historyData);
      }

      if (therapiesRes.ok) {
        const therapiesData = await therapiesRes.json();
        setActiveTherapies(therapiesData);
      }

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setPrivateNotes(notesData);
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      toast.error("Failed to load patient data");
    } finally {
      setLoading(false);
    }
  };

  const addPrivateNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/doctor/patients/${patientId}/private-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({
            content: newNote,
            type: newNoteType,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Private note added successfully");
        setNewNote("");
        fetchPatientData(); // Refresh data
      } else {
        toast.error("Failed to add private note");
      }
    } catch (error) {
      console.error("Error adding private note:", error);
      toast.error("Error adding private note");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient profile...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Patient not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Patient Profile" description="Detailed patient profile" />
      <PageBreadcrumb pageTitle={`Patient Profile - ${patient.name}`} />

      <div className="p-6">
        {/* Patient Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {patient.name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                <p className="text-gray-600">{patient.email}</p>
                <p className="text-sm text-gray-500">
                  Age: {patient.age || "N/A"} | DOB: {patient.date_of_birth ? formatDate(patient.date_of_birth) : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/doctor/appointments?patient=${patientId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Appointments
              </button>
              <button
                onClick={() => navigate(`/doctor/therapy/create?patient=${patientId}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Therapy
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: "overview", label: "Overview" },
                { key: "medical-history", label: "Medical History" },
                { key: "active-therapies", label: "Active Therapies" },
                { key: "private-notes", label: "Private Notes" },
                { key: "documents", label: "Documents" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Email:</span> {patient.email}</p>
                      <p><span className="font-medium">Phone:</span> {patient.phone || "N/A"}</p>
                      <p><span className="font-medium">Address:</span> {patient.address || "N/A"}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Medical Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Blood Type:</span> {patient.blood_type || "N/A"}</p>
                      <p><span className="font-medium">Allergies:</span> {patient.allergies || "None reported"}</p>
                      <p><span className="font-medium">Emergency Contact:</span> {patient.emergency_contact || "N/A"}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{medicalHistory.length}</div>
                    <div className="text-sm text-gray-600">Medical Records</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{activeTherapies.length}</div>
                    <div className="text-sm text-gray-600">Active Therapies</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{privateNotes.length}</div>
                    <div className="text-sm text-gray-600">Private Notes</div>
                  </div>
                </div>
              </div>
            )}

            {/* Medical History Tab */}
            {activeTab === "medical-history" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Medical History</h3>
                  <button
                    onClick={() => navigate(`/doctor/patients/${patientId}/medical-history/add`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Record
                  </button>
                </div>
                {medicalHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No medical history records found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalHistory.map((record) => (
                      <div key={record.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{record.title}</h4>
                          <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{record.description}</p>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                          {record.diagnosis && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {record.diagnosis}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Therapies Tab */}
            {activeTab === "active-therapies" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Therapies</h3>
                  <button
                    onClick={() => navigate(`/doctor/therapy/create?patient=${patientId}`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Therapy
                  </button>
                </div>
                {activeTherapies.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No active therapies found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeTherapies.map((therapy) => (
                      <div key={therapy.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{therapy.therapy_type}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(therapy.status)}`}>
                            {therapy.status}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{therapy.therapy_text}</p>
                        <div className="text-sm text-gray-500">
                          <p>Start Date: {formatDate(therapy.start_date)}</p>
                          {therapy.end_date && <p>End Date: {formatDate(therapy.end_date)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Private Notes Tab */}
            {activeTab === "private-notes" && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Private Note</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Note Type</label>
                        <select
                          value={newNoteType}
                          onChange={(e) => setNewNoteType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="general">General</option>
                          <option value="diagnosis">Diagnosis</option>
                          <option value="treatment">Treatment</option>
                          <option value="observation">Observation</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Note Content</label>
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your private note here..."
                        />
                      </div>
                      <button
                        onClick={addPrivateNote}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Private Notes</h3>
                  {privateNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No private notes found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {privateNotes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {note.type}
                            </span>
                            <span className="text-sm text-gray-500">{formatDate(note.created_at)}</span>
                          </div>
                          <p className="text-gray-700">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Patient Documents</h3>
                  <button
                    onClick={() => navigate(`/doctor/documents/upload?patient=${patientId}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload Document
                  </button>
                </div>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No documents found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                            <p className="text-sm text-gray-500">{formatDate(doc.uploaded_at)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`${API_URL}/${doc.file_path}`, '_blank')}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                            >
                              View
                            </button>
                            <button
                              onClick={() => window.open(`${API_URL}/${doc.file_path}`, '_blank')}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorPatientProfile;
