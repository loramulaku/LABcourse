// src/components/AnalysisRequestForm.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import AnalysisCalendar from "./AnalysisCalendar";
import Footer from "./Footer";

const AnalysisRequestForm = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [formData, setFormData] = useState({
    analysis_type_id: "",
    appointment_date: "",
    notes: "",
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalysisTypes = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/laboratories/${labId}/analysis-types`,
        );
        if (response.ok) {
          const data = await response.json();
          setAnalysisTypes(data);
        }
      } catch (error) {
        console.error("Error fetching analysis types:", error);
      }
    };

    fetchAnalysisTypes();
  }, [labId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedTimeSlot || !selectedDate) {
      setError("Please select both a date and time slot from the calendar.");
      return;
    }

    if (!formData.analysis_type_id) {
      setError("Please select an analysis type.");
      return;
    }

    try {
      // selectedTimeSlot already contains the full datetime (e.g., "2025-09-19T08:00")
      // We just need to add seconds if not present
      const fullDateTime = selectedTimeSlot.includes(":00")
        ? selectedTimeSlot
        : `${selectedTimeSlot}:00`;
      console.log("Using datetime:", fullDateTime);

      const requestData = {
        analysis_type_id: parseInt(formData.analysis_type_id),
        appointment_date: fullDateTime,
        laboratory_id: parseInt(labId),
        notes: formData.notes || "",
      };

      console.log("Sending analysis request:", requestData);

      const response = await fetch(
        `${API_URL}/api/laboratories/request-analysis`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(requestData),
        },
      );

      if (response.ok) {
        navigate("/my-analyses");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error response:", errorData);

        if (errorData.error === "TIME_SLOT_BOOKED") {
          setError(
            "This time slot is no longer available. Please select another time slot.",
          );
        } else {
          setError(
            errorData.error || errorData.details || "Failed to submit request",
          );
        }
      }
    } catch (error) {
      console.error("Error submitting analysis request:", error);
      setError("Network error. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(""); // Reset time slot when date changes
  };

  const handleTimeSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setError(""); // Clear any error messages when a valid time slot is selected
  };

  return (
    <div className="mx-4 sm:mx-[10%]">
      {/* Header Section */}
      <div className="text-center my-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-800 mb-4">
          Request Laboratory Analysis
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Select your preferred analysis type, date, and time for your appointment.
        </p>
      </div>

      <div className="max-w-6xl mx-auto mb-16">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Analysis Details Form */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Analysis Details
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Fill in the details for your analysis request
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="analysis_type_id"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Analysis Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="analysis_type_id"
                      name="analysis_type_id"
                      value={formData.analysis_type_id}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="">Select Analysis Type</option>
                      {analysisTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} {type.price ? `- €${type.price}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                      placeholder="Any additional notes or special requirements (e.g., fasting, medications)..."
                    />
                  </div>

                  {selectedTimeSlot && (
                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Appointment Scheduled
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            {new Date(selectedTimeSlot).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })} at{" "}
                            {new Date(selectedTimeSlot).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedTimeSlot || !formData.analysis_type_id}
                    className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all font-medium disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                  >
                    {!selectedTimeSlot ? 'Select Date & Time to Continue' : 'Submit Request'}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/laboratories')}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all font-medium"
                  >
                    ← Back to Laboratories
                  </button>
                </form>
              </div>

              {/* Calendar Component */}
              <div>
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Select Date & Time
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose your preferred appointment slot
                  </p>
                </div>
                <AnalysisCalendar
                  labId={labId}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onTimeSelect={handleTimeSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default AnalysisRequestForm;
