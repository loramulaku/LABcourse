import React, { useState, useEffect } from "react";
import { API_URL } from "../../api";
import { Plus, Edit2, Trash2, ChevronDown, X } from "lucide-react";
import { toast } from "react-toastify";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [expandedDept, setExpandedDept] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    phone: "",
    email: "",
    budget: "",
    numSpecializations: 0,
    specializations: [],
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/departments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      } else {
        toast.error("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Error fetching departments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingDept(null);
    setFormData({
      name: "",
      description: "",
      location: "",
      phone: "",
      email: "",
      budget: "",
      numSpecializations: 0,
      specializations: [],
    });
    setShowForm(true);
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      location: dept.location || "",
      phone: dept.phone || "",
      email: dept.email || "",
      budget: dept.budget || "",
      numSpecializations: dept.specializations?.length || 0,
      specializations: dept.specializations || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (deptId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/departments/${deptId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Department deleted successfully");
        fetchDepartments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete department");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Error deleting department");
    }
  };

  const handleNumSpecializationsChange = (num) => {
    const newNum = parseInt(num) || 0;
    const currentSpecs = [...formData.specializations];

    // Add empty strings if increasing
    while (currentSpecs.length < newNum) {
      currentSpecs.push("");
    }

    // Remove if decreasing
    if (currentSpecs.length > newNum) {
      currentSpecs.splice(newNum);
    }

    setFormData((prev) => ({
      ...prev,
      numSpecializations: newNum,
      specializations: currentSpecs,
    }));
  };

  const handleSpecializationChange = (index, value) => {
    const newSpecs = [...formData.specializations];
    newSpecs[index] = value;
    setFormData((prev) => ({
      ...prev,
      specializations: newSpecs,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Department name is required");
      return;
    }

    // Filter out empty specializations
    const validSpecs = formData.specializations.filter((s) => s.trim());

    try {
      const url = editingDept
        ? `${API_URL}/api/departments/${editingDept.id}`
        : `${API_URL}/api/departments`;
      const method = editingDept ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          specializations: validSpecs,
        }),
      });

      if (response.ok) {
        toast.success(
          editingDept
            ? "Department updated successfully"
            : "Department created successfully"
        );
        setShowForm(false);
        fetchDepartments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save department");
      }
    } catch (error) {
      console.error("Error saving department:", error);
      toast.error("Error saving department");
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full max-w-full mx-0 space-y-8">
        <div className="h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Department Management ({departments.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage hospital departments and specializations
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Plus size={20} />
          Add Department
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingDept ? "Edit Department" : "Add New Department"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g., Building A, Floor 2"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Budget
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Specializations
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.numSpecializations}
                  onChange={(e) => handleNumSpecializationsChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter how many specializations you want to add
                </p>
              </div>

              {/* Specialization Input Fields */}
              {formData.numSpecializations > 0 && (
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    Enter Specialization Names
                  </h4>
                  {Array.from({ length: formData.numSpecializations }).map(
                    (_, index) => (
                      <input
                        key={index}
                        type="text"
                        value={formData.specializations[index] || ""}
                        onChange={(e) =>
                          handleSpecializationChange(index, e.target.value)
                        }
                        placeholder={`Specialization ${index + 1}`}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editingDept ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments List */}
      <div className="space-y-4">
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              No departments found
            </p>
          </div>
        ) : (
          filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Department Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() =>
                  setExpandedDept(
                    expandedDept === dept.id ? null : dept.id
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {dept.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {dept.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      size={20}
                      className={`text-gray-600 dark:text-gray-400 transition-transform ${
                        expandedDept === dept.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedDept === dept.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50 space-y-4">
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dept.location && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Location
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {dept.location}
                        </p>
                      </div>
                    )}
                    {dept.phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Phone
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {dept.phone}
                        </p>
                      </div>
                    )}
                    {dept.email && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Email
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {dept.email}
                        </p>
                      </div>
                    )}
                    {dept.budget && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Budget
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          ${parseFloat(dept.budget).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Specializations */}
                  {dept.specializations && dept.specializations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Specializations ({dept.specializations.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {dept.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
