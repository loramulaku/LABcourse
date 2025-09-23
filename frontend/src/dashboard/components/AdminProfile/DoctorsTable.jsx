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
      // Ensure data is an array
      if (Array.isArray(data)) {
        setDoctors(data);
      } else if (data && Array.isArray(data.doctors)) {
        setDoctors(data.doctors);
      } else {
        console.error("Unexpected data format:", data);
        setDoctors([]);
        setMessage("No doctors data available");
      }
    } catch (error) {
      setMessage("Failed to fetch doctors");
      console.error("Error fetching doctors:", error);
      setDoctors([]);
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
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Manage Doctors ({doctors.length})
        </h3>
        <button
          onClick={fetchDoctors}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
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

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading doctors...
        </div>
      ) : !Array.isArray(doctors) || doctors.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No doctors found. Add your first doctor using the form above.
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20 dark:border-gray-700/50 bg-gradient-to-r from-blue-500/10 to-purple-600/10">
                <th className="text-left py-4 px-4 font-semibold text-foreground">
                  Photo
                </th>
                <th className="text-left py-4 px-4 font-semibold text-foreground">
                  Name
                </th>
                <th className="text-left py-4 px-4 font-semibold text-foreground">
                  Email
                </th>
                <th className="text-left py-4 px-4 font-semibold text-foreground">
                  Department
                </th>
                <th className="text-left py-4 px-4 font-semibold text-foreground">
                  License
                </th>
                <th className="text-left py-4 px-4 font-semibold text-foreground">
                  Phone
                </th>
                <th className="text-left py-4 px-4 font-semibold text-foreground">
                  Status
                </th>
                <th className="text-left py-4 px-4 font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(doctors) && doctors.map((doctor) => (
                <tr key={doctor.id} className="border-b border-white/10 dark:border-gray-700/30 hover:bg-white/5 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4">
                    <img
                      src={`http://localhost:5000${doctor.profile_image || '/uploads/avatars/default.png'}`}
                      alt={doctor.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gradient-to-r from-blue-500 to-purple-600"
                    />
                  </td>
                  <td className="py-4 px-4 text-foreground font-medium">
                    {doctor.name}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    {doctor.email}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    {doctor.department || "-"}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    {doctor.license_number || "-"}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    {doctor.phone || "-"}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full shadow-sm ${
                      doctor.account_status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {doctor.account_status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {/* TODO: Implement edit functionality */}}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
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
