import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, getAccessToken } from "../../api";
import { toast } from "react-toastify";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

const TherapyCreateForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    appointment_id: "",
    patient_id: "",
    therapy_text: "",
    medications: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    follow_up_date: "",
    therapy_type: "",
    start_date: "",
    end_date: "",
    priority: "medium",
    patient_notes: "",
    doctor_notes: "",
  });

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch patients and appointments
      const [patientsRes, appointmentsRes, templatesRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/api/appointments/doctor/dashboard`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/api/therapies/templates`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
      ]);

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData.filter((user) => user.role === "user"));
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load form data");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePatientSelect = (patientId) => {
    setFormData((prev) => ({
      ...prev,
      patient_id: patientId,
      appointment_id: "", // Reset appointment when patient changes
    }));
  };

  const handleAppointmentSelect = (appointmentId) => {
    const appointment = appointments.find((apt) => apt.id == appointmentId);
    if (appointment) {
      setFormData((prev) => ({
        ...prev,
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
      }));
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      therapy_type: template.therapy_type,
      medications: template.medications,
      dosage: template.dosage,
      frequency: template.frequency,
      duration: template.duration,
      instructions: template.instructions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.appointment_id ||
      !formData.patient_id ||
      !formData.therapy_text
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/therapies/doctor/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Therapy created successfully!");
        navigate("/dashboard/therapy");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create therapy");
      }
    } catch (error) {
      console.error("Error creating therapy:", error);
      toast.error("Error creating therapy");
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(
    (apt) => !formData.patient_id || apt.patient_id == formData.patient_id,
  );

  return (
    <>
      <PageMeta
        title="Create Therapy"
        description="Create new therapy for patient"
      />
      <PageBreadcrumb pageTitle="Create Therapy" />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Create New Therapy
              </h1>
              <p className="text-gray-600">
                Create a comprehensive therapy plan for your patient
              </p>
            </div>

            {/* Therapy Templates */}
            {templates.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Quick Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-3 text-left border rounded-lg transition-colors ${
                        selectedTemplate?.id === template.id
                          ? "border-blue-500 bg-blue-100"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {template.therapy_type}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient and Appointment Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="patient_id"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select Patient *
                  </label>
                  <select
                    id="patient_id"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="appointment_id"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Related Appointment *
                  </label>
                  <select
                    id="appointment_id"
                    name="appointment_id"
                    value={formData.appointment_id}
                    onChange={(e) => handleAppointmentSelect(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose an appointment...</option>
                    {filteredAppointments.map((appointment) => (
                      <option key={appointment.id} value={appointment.id}>
                        {new Date(
                          appointment.scheduled_for,
                        ).toLocaleDateString()}{" "}
                        - {appointment.patient_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Therapy Type and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="therapy_type"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Therapy Type
                  </label>
                  <input
                    type="text"
                    id="therapy_type"
                    name="therapy_type"
                    value={formData.therapy_type}
                    onChange={handleInputChange}
                    placeholder="e.g., Medication, Physical Therapy"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Duration
                  </label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 2 weeks, 1 month"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="start_date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="end_date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="follow_up_date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Follow-up Date
                  </label>
                  <input
                    type="datetime-local"
                    id="follow_up_date"
                    name="follow_up_date"
                    value={formData.follow_up_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Therapy Instructions */}
              <div>
                <label
                  htmlFor="therapy_text"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Therapy Instructions *
                </label>
                <textarea
                  id="therapy_text"
                  name="therapy_text"
                  value={formData.therapy_text}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Detailed therapy instructions and treatment plan..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Medications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="medications"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Medications
                  </label>
                  <input
                    type="text"
                    id="medications"
                    name="medications"
                    value={formData.medications}
                    onChange={handleInputChange}
                    placeholder="e.g., Paracetamol, Ibuprofen"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dosage"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Dosage
                  </label>
                  <input
                    type="text"
                    id="dosage"
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleInputChange}
                    placeholder="e.g., 500mg, 2 tablets"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="frequency"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Frequency
                  </label>
                  <input
                    type="text"
                    id="frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    placeholder="e.g., Twice daily, Every 8 hours"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Additional Instructions */}
              <div>
                <label
                  htmlFor="instructions"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Special Instructions
                </label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Any special instructions, side effects to watch for, dietary restrictions..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="patient_notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Patient Notes
                  </label>
                  <textarea
                    id="patient_notes"
                    name="patient_notes"
                    value={formData.patient_notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Notes visible to the patient..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="doctor_notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Doctor Notes (Private)
                  </label>
                  <textarea
                    id="doctor_notes"
                    name="doctor_notes"
                    value={formData.doctor_notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Private notes for doctor reference only..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/therapy")}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Therapy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default TherapyCreateForm;
