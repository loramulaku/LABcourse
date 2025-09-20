import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, getAccessToken } from "../../api";
import { toast } from "react-toastify";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

const DoctorTherapyDashboard = () => {
  const navigate = useNavigate();
  const [therapies, setTherapies] = useState([]);
  const [stats, setStats] = useState({});
  const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [calendarView, setCalendarView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTherapyData();
  }, []);

  const fetchTherapyData = async () => {
    try {
      setLoading(true);
      const [therapiesRes, statsRes, followUpsRes] = await Promise.all([
        fetch(`${API_URL}/api/therapies/doctor/dashboard`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/api/therapies/doctor/stats`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/api/therapies/doctor/upcoming-followups`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
      ]);

      if (therapiesRes.ok) {
        const therapiesData = await therapiesRes.json();
        setTherapies(therapiesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (followUpsRes.ok) {
        const followUpsData = await followUpsRes.json();
        setUpcomingFollowUps(followUpsData);
      }
    } catch (error) {
      console.error("Error fetching therapy data:", error);
      toast.error("Failed to load therapy data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTherapiesByStatus = async (status) => {
    try {
      const response = await fetch(
        `${API_URL}/api/therapies/doctor/status/${status}`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error fetching therapies by status:", error);
    }
    return [];
  };

  const updateTherapyStatus = async (therapyId, newStatus) => {
    try {
      const response = await fetch(
        `${API_URL}/api/therapies/doctor/${therapyId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({ status: newStatus }),
          credentials: "include",
        },
      );

      if (response.ok) {
        toast.success("Therapy status updated successfully");
        fetchTherapyData(); // Refresh data
      } else {
        toast.error("Failed to update therapy status");
      }
    } catch (error) {
      console.error("Error updating therapy status:", error);
      toast.error("Error updating therapy status");
    }
  };

  const filteredTherapies = therapies.filter((therapy) => {
    switch (activeTab) {
      case "draft":
        return therapy.status === "draft";
      case "pending":
        return therapy.status === "pending";
      case "confirmed":
        return therapy.status === "confirmed";
      case "active":
        return therapy.status === "active";
      case "completed":
        return therapy.status === "completed";
      case "cancelled":
        return therapy.status === "cancelled";
      case "overdue":
        return therapy.status === "overdue";
      default:
        return true;
    }
  });

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
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "on_hold":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading therapy dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Therapy Management"
        description="Manage patient therapies"
      />
      <PageBreadcrumb pageTitle="Therapy Management" />

      <div className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Therapy Management
              </h1>
              <p className="text-gray-600">
                Manage patient therapies and prescriptions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/dashboard/therapy/create")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Therapy
              </button>
              <button
                onClick={() => navigate("/dashboard/therapy/calendar")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Calendar View
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
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
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Therapies
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_therapies || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Active Therapies
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.active_therapies || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pending_therapies || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Follow-ups
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {upcomingFollowUps.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        {upcomingFollowUps.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4">
              Upcoming Follow-ups
            </h2>
            <div className="space-y-3">
              {upcomingFollowUps.slice(0, 3).map((followUp) => (
                <div
                  key={followUp.id}
                  className="flex justify-between items-center bg-white p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {followUp.patient_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {followUp.therapy_text.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-800">
                      {formatDate(followUp.follow_up_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Therapy List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Patient Therapies
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
              {[
                { key: "all", label: "All Therapies" },
                { key: "draft", label: "Draft" },
                { key: "pending", label: "Pending" },
                { key: "confirmed", label: "Confirmed" },
                { key: "active", label: "Active" },
                { key: "completed", label: "Completed" },
                { key: "cancelled", label: "Cancelled" },
                { key: "overdue", label: "Overdue" },
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

          <div className="overflow-x-auto">
            {filteredTherapies.length === 0 ? (
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
                <p className="text-gray-500">No therapies found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Therapy Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTherapies.map((therapy) => (
                    <tr key={therapy.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {therapy.patient_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {therapy.patient_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {therapy.therapy_type || "General Therapy"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {therapy.start_date
                            ? formatDate(therapy.start_date)
                            : "Not set"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(therapy.priority)}`}
                        >
                          {therapy.priority || "medium"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(therapy.status)}`}
                        >
                          {therapy.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              navigate(`/dashboard/therapy/edit/${therapy.id}`)
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/dashboard/therapy/view/${therapy.id}`)
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            View
                          </button>
                          {therapy.status === "draft" && (
                            <button
                              onClick={() =>
                                updateTherapyStatus(therapy.id, "pending")
                              }
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Send
                            </button>
                          )}
                          {therapy.status === "pending" && (
                            <button
                              onClick={() =>
                                updateTherapyStatus(therapy.id, "confirmed")
                              }
                              className="text-green-600 hover:text-green-900"
                            >
                              Confirm
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
    </>
  );
};

export default DoctorTherapyDashboard;
