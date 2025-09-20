import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, getAccessToken } from "../../api";
import { toast } from "react-toastify";
import PageMeta from "../../dashboard/components/common/PageMeta";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";

const DoctorPrescription = () => {
  const navigate = useNavigate();
  const { action } = useParams();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("create");

  // Prescription form state
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_id: "",
    medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    diagnosis: "",
    notes: "",
    follow_up_date: "",
  });

  useEffect(() => {
    if (action === "history") {
      fetchPrescriptions();
    } else {
      fetchPatients();
    }
  }, [action]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/prescriptions`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      } else {
        toast.error("Failed to load prescriptions");
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Error loading prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        toast.error("Failed to load patients");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Error loading patients");
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medications: [...prev.medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
    }));
  };

  const removeMedication = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const updateMedication = (index, field, value) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prescriptionForm.patient_id) {
      toast.error("Please select a patient");
      return;
    }

    if (prescriptionForm.medications.every(med => !med.name.trim())) {
      toast.error("Please add at least one medication");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/doctor/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify(prescriptionForm),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Prescription created successfully");
        // Reset form
        setPrescriptionForm({
          patient_id: "",
          medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
          diagnosis: "",
          notes: "",
          follow_up_date: "",
        });
        navigate("/doctor/prescription/history");
      } else {
        toast.error("Failed to create prescription");
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
      toast.error("Error creating prescription");
    }
  };

  const printPrescription = async (prescriptionId) => {
    try {
      const response = await fetch(`${API_URL}/api/doctor/prescriptions/${prescriptionId}/print`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription-${prescriptionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Prescription downloaded successfully");
      } else {
        toast.error("Failed to generate prescription PDF");
      }
    } catch (error) {
      console.error("Error printing prescription:", error);
      toast.error("Error generating prescription PDF");
    }
  };

  const emailPrescription = async (prescriptionId) => {
    try {
      const response = await fetch(`${API_URL}/api/doctor/prescriptions/${prescriptionId}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Prescription sent to patient's email successfully");
      } else {
        toast.error("Failed to send prescription email");
      }
    } catch (error) {
      console.error("Error emailing prescription:", error);
      toast.error("Error sending prescription email");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Prescription Management" description="Create and manage prescriptions" />
      <PageBreadcrumb pageTitle={action === "history" ? "Prescription History" : "Create Prescription"} />

      <div className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {action === "history" ? "Prescription History" : "Create Prescription"}
              </h1>
              <p className="text-gray-600">
                {action === "history" 
                  ? "View and manage all prescriptions" 
                  : "Create new prescription for patients"
                }
              </p>
            </div>
            <div className="flex gap-3">
              {action === "history" ? (
                <button
                  onClick={() => navigate("/doctor/prescription/create")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New
                </button>
              ) : (
                <button
                  onClick={() => navigate("/doctor/prescription/history")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View History
                </button>
              )}
            </div>
          </div>

          {/* Create Prescription Form */}
          {action === "create" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient *
                  </label>
                  <select
                    value={prescriptionForm.patient_id}
                    onChange={(e) => setPrescriptionForm(prev => ({ ...prev, patient_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnosis *
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.diagnosis}
                    onChange={(e) => setPrescriptionForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter diagnosis..."
                    required
                  />
                </div>

                {/* Medications */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Medications *
                    </label>
                    <button
                      type="button"
                      onClick={addMedication}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      Add Medication
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {prescriptionForm.medications.map((medication, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">Medication {index + 1}</h4>
                          {prescriptionForm.medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedication(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Medication Name *
                            </label>
                            <input
                              type="text"
                              value={medication.name}
                              onChange={(e) => updateMedication(index, "name", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Paracetamol"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dosage *
                            </label>
                            <input
                              type="text"
                              value={medication.dosage}
                              onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 500mg"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Frequency *
                            </label>
                            <select
                              value={medication.frequency}
                              onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select frequency...</option>
                              <option value="Once daily">Once daily</option>
                              <option value="Twice daily">Twice daily</option>
                              <option value="Three times daily">Three times daily</option>
                              <option value="Four times daily">Four times daily</option>
                              <option value="As needed">As needed</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration *
                            </label>
                            <input
                              type="text"
                              value={medication.duration}
                              onChange={(e) => updateMedication(index, "duration", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 7 days"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Special Instructions
                          </label>
                          <textarea
                            value={medication.instructions}
                            onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Take with food, avoid alcohol..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={prescriptionForm.notes}
                    onChange={(e) => setPrescriptionForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional notes or instructions..."
                  />
                </div>

                {/* Follow-up Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={prescriptionForm.follow_up_date}
                    onChange={(e) => setPrescriptionForm(prev => ({ ...prev, follow_up_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/doctor/prescription/history")}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Prescription History */}
          {action === "history" && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Prescription History</h2>
              </div>
              
              <div className="overflow-x-auto">
                {prescriptions.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-500">No prescriptions found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Diagnosis
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Medications
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {prescriptions.map((prescription) => (
                        <tr key={prescription.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {prescription.patient_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {prescription.patient_email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {prescription.diagnosis}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {prescription.medications?.length || 0} medications
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(prescription.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => printPrescription(prescription.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Print
                              </button>
                              <button
                                onClick={() => emailPrescription(prescription.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Email
                              </button>
                              <button
                                onClick={() => navigate(`/doctor/prescription/view/${prescription.id}`)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DoctorPrescription;
