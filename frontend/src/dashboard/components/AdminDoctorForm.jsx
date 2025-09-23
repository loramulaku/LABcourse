import React, { useRef, useState } from "react";
import apiFetch, { API_URL } from "../../api";

export default function AdminDoctorForm({ 
  doctor = null, 
  onSave, 
  onCancel, 
  isEdit = false 
}) {
  const [form, setForm] = useState({
    name: doctor?.name || "",
    email: doctor?.email || "",
    password: "",
    specialization: doctor?.specialization || "",
    degree: doctor?.degree || "",
    experience_years: doctor?.experience_years || "",
    fees: doctor?.consultation_fee || doctor?.fees || "",
    address_line1: doctor?.address_line1 || "",
    address_line2: doctor?.address_line2 || "",
    about: doctor?.about || "",
    available: doctor?.available !== undefined ? doctor.available : true
  });
  
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.email.includes('@')) newErrors.email = "Valid email is required";
    if (!isEdit && !form.password.trim()) newErrors.password = "Password is required";
    if (!isEdit && form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.specialization.trim()) newErrors.specialization = "Specialization is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    const fd = new FormData();
    
    // Add form fields
    Object.keys(form).forEach(key => {
      if (key !== 'password' || form.password.trim()) {
        fd.append(key, form[key]);
      }
    });
    
    if (image) fd.append("image", image);

    try {
      const url = isEdit 
        ? `${API_URL}/api/doctors/${doctor.id}`
        : `${API_URL}/api/doctors`;
        
      const method = isEdit ? "PUT" : "POST";
      
      const data = await apiFetch(url, {
        method,
        body: fd,
        credentials: "include",
      });
      
      console.log("Doctor saved:", data);
      alert(isEdit ? "Doctor updated successfully" : "Doctor created successfully");
      
      if (onSave) onSave(data);
      
      // Reset form if creating new doctor
      if (!isEdit) {
        setForm({
          name: "",
          email: "",
          password: "",
          specialization: "",
          degree: "",
          experience_years: "",
          fees: "",
          address_line1: "",
          address_line2: "",
          about: "",
          available: true
        });
        setImage(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      alert(err?.error || `Error ${isEdit ? 'updating' : 'creating'} doctor`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {isEdit ? "Edit Doctor" : "Add Doctor"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isEdit ? "Update doctor information" : "Create a new doctor profile"}
        </p>
      </div>
      
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter doctor's name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password {!isEdit && '*'}
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Specialization Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Speciality *
            </label>
            <select
              name="specialization"
              value={form.specialization}
              onChange={onChange}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.specialization ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
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
            {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>}
          </div>

          {/* Degree */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Degree
            </label>
            <input
              name="degree"
              value={form.degree}
              onChange={onChange}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter degree (e.g., MD, MBBS)"
            />
          </div>

          {/* Experience with Years suffix */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Experience
            </label>
            <input
              type="number"
              min="0"
              name="experience_years"
              value={form.experience_years}
              onChange={onChange}
              className="w-full p-3 pr-20 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter years of experience"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              Years
            </span>
          </div>

          {/* Fees with Euro symbol */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              € Fees
            </label>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              €
            </span>
            <input
              type="number"
              step="0.01"
              name="fees"
              value={form.fees}
              onChange={onChange}
              className="w-full pl-7 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter consultation fees"
            />
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address Line 1
            </label>
            <input
              name="address_line1"
              value={form.address_line1}
              onChange={onChange}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter address line 1"
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address Line 2
            </label>
            <input
              name="address_line2"
              value={form.address_line2}
              onChange={onChange}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter address line 2"
            />
          </div>
        </div>

        {/* About - Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            About
          </label>
          <textarea
            name="about"
            value={form.about}
            onChange={onChange}
            rows={3}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter doctor's bio and description"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Choose File
          </label>
          <input
            ref={fileRef}
            name="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {image && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Selected: {image.name}
            </p>
          )}
        </div>

        {/* Available Toggle */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="available"
            checked={form.available}
            onChange={onChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Doctor is available for appointments
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Doctor" : "Save Doctor")}
          </button>
        </div>
      </form>
    </div>
  );
}
