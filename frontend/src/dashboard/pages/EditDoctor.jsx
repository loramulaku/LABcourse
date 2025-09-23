import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../../api";

export default function EditDoctor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const fetchDoctor = async () => {
    try {
      const response = await fetch(`${API_URL}/api/doctors/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDoctor(data);
      } else {
        console.error("Error fetching doctor details");
        alert("Error fetching doctor details");
      }
    } catch (err) {
      console.error("Error fetching doctor details:", err);
      alert("Error fetching doctor details");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setDoctor(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/doctors/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
        body: JSON.stringify(doctor),
      });

      if (response.ok) {
        alert("Doctor updated successfully");
        navigate("/dashboard/doctors-management");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error updating doctor");
      }
    } catch (err) {
      console.error("Error updating doctor:", err);
      alert("Error updating doctor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-full mx-0 space-y-8">
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="w-full max-w-full mx-0 space-y-8">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Doctor not found.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edit Doctor: {doctor.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Update doctor profile information</p>
        </div>
        <button
          onClick={() => navigate("/dashboard/doctors-management")}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Back to List
        </button>
      </div>

      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <h4 className="col-span-2 text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
              Basic Information
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={doctor.name || ""}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={doctor.email || ""}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                value={doctor.first_name || ""}
                onChange={(e) => handleFieldChange('first_name', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                value={doctor.last_name || ""}
                onChange={(e) => handleFieldChange('last_name', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
              <input
                type="tel"
                value={doctor.phone || ""}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-2 gap-4">
            <h4 className="col-span-2 text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
              Professional Information
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialization</label>
              <select
                value={doctor.specialization || ""}
                onChange={(e) => handleFieldChange('specialization', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Speciality</option>
                <option value="General physician">General physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatricians">Pediatricians</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gastroenterologist">Gastroenterologist</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Orthopedist">Orthopedist</option>
                <option value="Psychiatrist">Psychiatrist</option>
                <option value="Oncologist">Oncologist</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <input
                type="text"
                value={doctor.department || ""}
                onChange={(e) => handleFieldChange('department', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Degree</label>
              <input
                type="text"
                value={doctor.degree || ""}
                onChange={(e) => handleFieldChange('degree', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">License Number</label>
              <input
                type="text"
                value={doctor.license_number || ""}
                onChange={(e) => handleFieldChange('license_number', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience (Years)</label>
              <input
                type="number"
                min="0"
                value={doctor.experience_years || ""}
                onChange={(e) => handleFieldChange('experience_years', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience Details</label>
              <textarea
                value={doctor.experience || ""}
                onChange={(e) => handleFieldChange('experience', e.target.value)}
                rows="3"
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-2 gap-4">
            <h4 className="col-span-2 text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
              Financial Information
            </h4>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Consultation Fee (€)</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              <input
                type="number"
                step="0.01"
                value={doctor.consultation_fee || doctor.fees || ""}
                onChange={(e) => handleFieldChange('consultation_fee', e.target.value)}
                className="w-full pl-7 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={doctor.available}
                onChange={(e) => handleFieldChange('available', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Doctor is available for appointments
              </label>
            </div>
          </div>

          {/* Address Information */}
          <div className="grid grid-cols-2 gap-4">
            <h4 className="col-span-2 text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
              Address Information
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address Line 1</label>
              <input
                type="text"
                value={doctor.address_line1 || ""}
                onChange={(e) => handleFieldChange('address_line1', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address Line 2</label>
              <input
                type="text"
                value={doctor.address_line2 || ""}
                onChange={(e) => handleFieldChange('address_line2', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
              <input
                type="text"
                value={doctor.country || ""}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City/State</label>
              <input
                type="text"
                value={doctor.city_state || ""}
                onChange={(e) => handleFieldChange('city_state', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Postal Code</label>
              <input
                type="text"
                value={doctor.postal_code || ""}
                onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Social Media */}
          <div className="grid grid-cols-2 gap-4">
            <h4 className="col-span-2 text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
              Social Media & Contact
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Facebook</label>
              <input
                type="url"
                value={doctor.facebook || ""}
                onChange={(e) => handleFieldChange('facebook', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">X (Twitter)</label>
              <input
                type="url"
                value={doctor.x || ""}
                onChange={(e) => handleFieldChange('x', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LinkedIn</label>
              <input
                type="url"
                value={doctor.linkedin || ""}
                onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instagram</label>
              <input
                type="url"
                value={doctor.instagram || ""}
                onChange={(e) => handleFieldChange('instagram', e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2 mb-4">
              About Doctor
            </h4>
            <textarea
              value={doctor.about || ""}
              onChange={(e) => handleFieldChange('about', e.target.value)}
              rows="4"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="About the doctor"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/doctors-management")}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Update Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
