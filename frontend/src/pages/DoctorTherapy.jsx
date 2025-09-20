import React, { useEffect, useState } from "react";
import { API_URL, getAccessToken } from "../api";
import { useParams, useNavigate } from "react-router-dom";

const DoctorTherapy = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [therapyText, setTherapyText] = useState("");
  const [medications, setMedications] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch appointment details
        const res = await fetch(`${API_URL}/api/appointments/doctor/refused`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 403)
            throw new Error("Only doctors can access this page");
          throw new Error("Failed to load appointment data");
        }

        const data = await res.json();
        const appointmentData = data.find(
          (apt) => apt.appointment_id == appointmentId,
        );

        if (!appointmentData) {
          throw new Error("Appointment not found");
        }

        setAppointment(appointmentData);
      } catch (e) {
        setError(e.message || "Failed to load appointment");
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const submitTherapy = async (e) => {
    e.preventDefault();
    if (!therapyText.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/api/therapies/doctor/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          appointment_id: parseInt(appointmentId),
          patient_id: appointment.patient_id,
          therapy_text: therapyText.trim(),
          medications: medications.trim() || null,
          dosage: dosage.trim() || null,
          frequency: frequency.trim() || null,
          duration: duration.trim() || null,
          instructions: instructions.trim() || null,
          follow_up_date: followUpDate || null,
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to save therapy");

      alert(
        "Therapy/Medications saved successfully! Patient can now see this prescription.",
      );
      navigate("/doctor/refused");
    } catch (e) {
      alert(e.message || "Error saving therapy");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-10">
        <p className="text-red-600 text-center">{error}</p>
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/doctor/refused")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Refused Appointments
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <p className="text-red-600 text-center mt-8">Appointment not found</p>
    );
  }

  return (
    <div className="my-10">
      <div className="mb-6">
        <button
          onClick={() => navigate("/doctor/refused")}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to Refused Appointments
        </button>
        <h1 className="text-3xl font-medium mb-2">
          Prescribe Therapy & Medications
        </h1>
        <p className="text-gray-600">
          Write detailed therapy and medication instructions for this patient.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Patient Info */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Patient Name</div>
              <div className="font-medium">{appointment.patient_name}</div>
            </div>
            <div>
              <div className="text-gray-500">Patient ID</div>
              <div className="font-medium">{appointment.patient_id}</div>
            </div>
            <div>
              <div className="text-gray-500">Email</div>
              <div className="font-medium">{appointment.patient_email}</div>
            </div>
            <div>
              <div className="text-gray-500">Phone</div>
              <div className="font-medium">
                {appointment.patient_phone || "Not provided"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Appointment Date</div>
              <div className="font-medium">
                {new Date(appointment.scheduled_for).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <div className="font-medium">{appointment.status}</div>
            </div>
            <div>
              <div className="text-gray-500">Reason for Refusal</div>
              <div className="font-medium">{appointment.reason}</div>
            </div>
            {appointment.notes && (
              <div>
                <div className="text-gray-500">Notes</div>
                <div className="font-medium">{appointment.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Therapy Form */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-xl font-semibold mb-4">
            Therapy & Medication Prescription
          </h2>
          <form onSubmit={submitTherapy} className="space-y-4">
            <div>
              <label
                htmlFor="therapy"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Therapy Instructions *
              </label>
              <textarea
                id="therapy"
                className="w-full border border-gray-300 rounded px-3 py-2 min-h-[120px]"
                placeholder="Write detailed therapy instructions and treatment plan..."
                value={therapyText}
                onChange={(e) => setTherapyText(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="e.g., Paracetamol, Ibuprofen"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
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
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="e.g., 500mg, 2 tablets"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
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
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="e.g., Twice daily, Every 8 hours"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                />
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
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="e.g., 7 days, 2 weeks"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Special Instructions
              </label>
              <textarea
                id="instructions"
                className="w-full border border-gray-300 rounded px-3 py-2 min-h-[80px]"
                placeholder="Any special instructions, side effects to watch for, dietary restrictions..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="followUpDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Follow-up Date (Optional)
              </label>
              <input
                type="datetime-local"
                id="followUpDate"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting || !therapyText.trim()}
                className={`px-6 py-2 rounded text-white ${
                  submitting || !therapyText.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting ? "Saving..." : "Save Therapy & Medications"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/doctor/refused")}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorTherapy;
