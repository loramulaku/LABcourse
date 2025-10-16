import React, { useState, useEffect } from "react";
import apiFetch, { API_URL } from "../../api";

export default function Laboratories() {
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLaboratories();
  }, []);

  const fetchLaboratories = async () => {
    try {
      console.log('🔍 Fetching laboratories from API...');
      
      const data = await apiFetch(`${API_URL}/api/laboratories`, {
        credentials: "include",
      });
      
      console.log('✅ Laboratories received:', data);
      console.log('   Count:', Array.isArray(data) ? data.length : 0);
      
      if (Array.isArray(data)) {
        setLaboratories(data);
        console.log('✅ Laboratories set in state:', data.length, 'items');
      } else {
        console.error('❌ Expected array, got:', typeof data);
        setLaboratories([]);
      }
    } catch (error) {
      console.error("❌ Error fetching laboratories:", error);
      setLaboratories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (labId) => {
    if (window.confirm("Are you sure you want to delete this laboratory?")) {
      try {
        await apiFetch(`${API_URL}/api/laboratories/${labId}`, {
          method: "DELETE",
          credentials: "include",
        });
        setLaboratories(laboratories.filter((lab) => lab.id !== labId));
        alert("Laboratory deleted successfully");
      } catch (error) {
        console.error("Error deleting laboratory:", error);
        alert("Error deleting laboratory");
      }
    }
  };

  const handleUpdate = (labId) => {
    // Navigate to edit page or open modal
    window.location.href = `/dashboard/laboratories-crud?edit=${labId}`;
  };

  const filteredLaboratories = laboratories.filter(
    (lab) =>
      lab.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Laboratories
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage laboratory facilities</p>
        </div>
        <button
          onClick={() => (window.location.href = "/dashboard/add-laboratory")}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Laboratory
        </button>
      </div>

      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-white/20 dark:border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search laboratories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-600/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Laboratory
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-white/20 dark:divide-gray-700/50">
              {filteredLaboratories.map((lab) => (
                <tr
                  key={lab.id}
                  className="hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-300"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {lab.image ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={`${API_URL}/${lab.image}`}
                            alt={lab.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold shadow-lg">
                            {lab.name?.charAt(0)?.toUpperCase() || "L"}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {lab.name || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground max-w-xs truncate">
                      {lab.address || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {lab.phone || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {lab.email || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdate(lab.id)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 hover:scale-110"
                        title="Edit"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(lab.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:scale-110"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLaboratories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "No laboratories found matching your search."
                : "No laboratories found."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
