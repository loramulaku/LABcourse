import React, { useState, useEffect } from "react";
import { API_URL } from "../../api";
import { Edit2, Trash2, X, Upload } from "lucide-react";
import { toast } from "react-toastify";

export default function DoctorsCrud() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
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

  const fetchDepartments = async () => {
    try {
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
        console.error("Error fetching departments");
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept?.name || "N/A";
  };

  const handleEdit = async (doctor) => {
    try {
      const response = await fetch(`${API_URL}/api/doctors/${doctor.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const fullDoctorData = await response.json();
        setEditingDoctor(fullDoctorData);
        setSelectedDepartment(fullDoctorData.department_id || null);
        // Set photo preview if doctor has an image
        if (fullDoctorData.image) {
          const imageUrl = fullDoctorData.image.startsWith("http")
            ? fullDoctorData.image
            : `${API_URL}${fullDoctorData.image}`;
          setPhotoPreview(imageUrl);
        }
        setPhotoFile(null);
      } else {
        toast.error("Error fetching doctor details");
      }
    } catch (err) {
      console.error("Error fetching doctor details:", err);
      toast.error("Error fetching doctor details");
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
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
        toast.success("Doctor deleted successfully");
        fetchDoctors();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Error deleting doctor");
      }
    } catch (err) {
      console.error("Error deleting doctor:", err);
      toast.error("Error deleting doctor");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!editingDoctor.User?.name || !editingDoctor.User?.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData();
      
      // Add doctor fields
      formDataToSend.append("phone", editingDoctor.phone);
      formDataToSend.append("specialization", editingDoctor.specialization);
      formDataToSend.append("department_id", editingDoctor.department_id);
      formDataToSend.append("degree", editingDoctor.degree);
      formDataToSend.append("license_number", editingDoctor.license_number);
      formDataToSend.append("experience_years", editingDoctor.experience_years);
      formDataToSend.append("consultation_fee", editingDoctor.consultation_fee);
      formDataToSend.append("available", editingDoctor.available ?? true);
      
      // Add user fields
      formDataToSend.append("name", editingDoctor.User?.name);
      formDataToSend.append("email", editingDoctor.User?.email);

      // Add photo if a new one was selected
      if (photoFile) {
        formDataToSend.append("image", photoFile);
      }

      const response = await fetch(`${API_URL}/api/doctors/${editingDoctor.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success("Doctor updated successfully");
        setEditingDoctor(null);
        setSelectedDepartment(null);
        setPhotoPreview(null);
        setPhotoFile(null);
        fetchDoctors();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Error updating doctor");
      }
    } catch (err) {
      console.error("Error updating doctor:", err);
      toast.error("Error updating doctor");
    }
  };

  const handleFieldChange = (field, value) => {
    setEditingDoctor((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDepartmentChange = (deptId) => {
    setSelectedDepartment(deptId);
    setEditingDoctor((prev) => ({
      ...prev,
      department_id: deptId,
    }));
  };

  const getAvailableSpecializations = () => {
    if (!selectedDepartment) return [];
    const dept = departments.find((d) => d.id === selectedDepartment);
    return dept?.specializations || [];
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.User?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.User?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Edit & Delete Doctors ({doctors.length})
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage existing doctor profiles
        </p>
      </div>

      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder="Search doctors by name, email, or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Edit Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Doctor
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {editingDoctor.User?.name || "N/A"} • {editingDoctor.User?.email || "N/A"}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingDoctor(null);
                  setSelectedDepartment(null);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Photo Upload */}
              <div>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Doctor Photo
                </h4>
                <div className="flex flex-col items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Doctor preview"
                        className="w-40 h-40 rounded-lg object-cover border-2 border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-40 h-40 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                      <Upload size={32} className="text-gray-400" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload size={18} />
                    Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingDoctor.User?.name || ""}
                      onChange={(e) => {
                        setEditingDoctor((prev) => ({
                          ...prev,
                          User: { ...prev.User, name: e.target.value },
                        }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingDoctor.User?.email || ""}
                      onChange={(e) => {
                        setEditingDoctor((prev) => ({
                          ...prev,
                          User: { ...prev.User, email: e.target.value },
                        }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editingDoctor.phone || ""}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Professional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <select
                      value={selectedDepartment || ""}
                      onChange={(e) =>
                        handleDepartmentChange(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specialization
                    </label>
                    <select
                      value={editingDoctor.specialization || ""}
                      onChange={(e) =>
                        handleFieldChange("specialization", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedDepartment}
                    >
                      <option value="">
                        {!selectedDepartment
                          ? "Select Department First"
                          : "Select Specialization"}
                      </option>
                      {getAvailableSpecializations().map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Degree
                    </label>
                    <input
                      type="text"
                      value={editingDoctor.degree || ""}
                      onChange={(e) => handleFieldChange("degree", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={editingDoctor.license_number || ""}
                      onChange={(e) =>
                        handleFieldChange("license_number", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingDoctor.experience_years || ""}
                      onChange={(e) =>
                        handleFieldChange("experience_years", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Consultation Fee (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingDoctor.consultation_fee || ""}
                      onChange={(e) =>
                        handleFieldChange("consultation_fee", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Availability Checkbox */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingDoctor.available ?? true}
                        onChange={(e) =>
                          handleFieldChange("available", e.target.checked)
                        }
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Available for Appointments
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Patients can book appointments with this doctor when checked
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDoctor(null);
                    setSelectedDepartment(null);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No doctors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Photo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Specialization
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {filteredDoctors.map((doctor, index) => (
                  <tr
                    key={doctor.id}
                    className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50 dark:bg-gray-700/30"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm">
                      {doctor.image ? (
                        <img
                          src={
                            doctor.image.startsWith("http")
                              ? doctor.image
                              : `${API_URL}${doctor.image}`
                          }
                          alt={doctor.User?.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-xs text-gray-600 dark:text-gray-300">No photo</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {doctor.User?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {doctor.User?.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {getDepartmentName(doctor.department_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {doctor.specialization || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(doctor)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          title="Edit doctor"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          title="Delete doctor"
                        >
                          <Trash2 size={16} />
                          Delete
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
    </div>
  );
}
