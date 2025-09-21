import React, { useState, useEffect } from "react";
import apiFetch from "../../../api";

export default function DoctorsTable() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin-profiles/doctors", {
        method: "GET",
      });
      setDoctors(data);
    } catch (error) {
      setMessage("Failed to fetch doctors");
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to delete doctor "${doctorName}"?`)) {
      return;
    }

    try {
      await apiFetch(`/api/admin-profiles/doctors/${doctorId}`, {
        method: "DELETE",
      });
      setMessage("Doctor deleted successfully!");
      fetchDoctors(); // Refresh the list
    } catch (error) {
      setMessage("Failed to delete doctor");
      console.error("Error deleting doctor:", error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Manage Doctors ({doctors.length})
        </h3>
        <button
          onClick={fetchDoctors}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg p-3 ${
          message.includes("successfully") 
            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        }`}>
          {message}
        </div>
      )}

      {doctors.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No doctors found. Add your first doctor using the form above.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-white/90">
                  Photo
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-white/90">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-white/90">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-white/90">
                  Department
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-white/90">
                  License
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-white/90">
                  Phone
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-white/90">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-white/90">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4">
                    <img
                      src={`http://localhost:5000${doctor.profile_image || '/uploads/avatars/default.png'}`}
                      alt={doctor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    {doctor.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {doctor.email}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {doctor.department || "-"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {doctor.license_number || "-"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {doctor.phone || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      doctor.account_status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {doctor.account_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {/* TODO: Implement edit functionality */}}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
