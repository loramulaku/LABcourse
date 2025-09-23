import React, { useState, useEffect } from "react";
import { API_URL } from "../../api";

export default function AdminDoctorsManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/doctors`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        console.error("Error fetching doctors");
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    
    try {
      const response = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        alert("Doctor deleted successfully");
        fetchDoctors();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error deleting doctor");
      }
    } catch (err) {
      console.error("Error deleting doctor:", err);
      alert("Error deleting doctor");
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full max-w-full mx-0 space-y-8">
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Manage Doctors ({doctors.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View and manage all doctor profiles</p>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-white/20 dark:border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
        
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Specialization</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Experience</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Fees</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Available</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{doctor.name || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{doctor.email || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{doctor.phone || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{doctor.specialization || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{doctor.department || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{doctor.experience_years ? `${doctor.experience_years} years` : "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">€{doctor.consultation_fee || doctor.fees || "N/A"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doctor.available 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {doctor.available ? 'Available' : 'Not Available'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.href = `/dashboard/doctors-management/edit/${doctor.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          {filteredDoctors.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm ? "No doctors found matching your search." : "No doctors found. Add your first doctor to get started."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}