import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, getAccessToken } from "../../api";
import { toast } from "react-toastify";
import PageMeta from "../../dashboard/components/common/PageMeta";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/appointments`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        toast.error("Failed to load appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Error loading appointments");
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const response = await fetch(
        `${API_URL}/api/doctor/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({ status: newStatus }),
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Appointment status updated successfully");
        fetchAppointments(); // Refresh data
      } else {
        toast.error("Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Error updating appointment status");
    }
  };

  const rescheduleAppointment = async (appointmentId, newDateTime) => {
    try {
      const response = await fetch(
        `${API_URL}/api/doctor/appointments/${appointmentId}/reschedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({ scheduled_for: newDateTime }),
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Appointment rescheduled successfully");
        fetchAppointments(); // Refresh data
      } else {
        toast.error("Failed to reschedule appointment");
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast.error("Error rescheduling appointment");
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
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "no_show":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus = activeTab === "all" || appointment.status === activeTab;
    const matchesSearch = 
      appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Appointments" description="Manage patient appointments" />
      <PageBreadcrumb pageTitle="Appointments" />

      <div className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
              <p className="text-gray-600">Manage and track all patient appointments</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/doctor/calendar")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Calendar View
              </button>
              <button
                onClick={() => navigate("/doctor/appointment-stats")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Statistics
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search appointments by patient name, email, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-200"
                  style={{backgroundColor: '#A7C7E7'}}
                />
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                {[
                  { key: "all", label: "All Appointments" },
                  { key: "pending", label: "Pending" },
                  { key: "confirmed", label: "Confirmed" },
                  { key: "completed", label: "Completed" },
                  { key: "cancelled", label: "Cancelled" },
                  { key: "no_show", label: "No Show" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              {filteredAppointments.length === 0 ? (
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500">
                    {searchTerm
                      ? "No appointments found matching your search."
                      : "No appointments found."}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.patient_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(appointment.scheduled_for)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {appointment.notes || "No notes"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/doctor/patient-profile/${appointment.patient_id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Patient
                            </button>
                            {appointment.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => {
                                    const newDateTime = prompt("Enter new date and time (YYYY-MM-DD HH:MM):");
                                    if (newDateTime) {
                                      rescheduleAppointment(appointment.id, newDateTime);
                                    }
                                  }}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Reschedule
                                </button>
                              </>
                            )}
                            {appointment.status === "confirmed" && (
                              <>
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => {
                                    const newDateTime = prompt("Enter new date and time (YYYY-MM-DD HH:MM):");
                                    if (newDateTime) {
                                      rescheduleAppointment(appointment.id, newDateTime);
                                    }
                                  }}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Reschedule
                                </button>
                              </>
                            )}
                            {(appointment.status === "pending" || appointment.status === "confirmed") && (
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default DoctorAppointments;
