import React, { useState } from "react";
import apiFetch from "../../../api";

export default function AddDoctorCard({ onDoctorAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    speciality: "",
    department: "",
    licenseNumber: "",
    degree: "",
    experience: "",
    about: "",
    fees: ""
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setProfilePhoto(e.target.files[0]);
  };

  const validateForm = () => {
    const errors = [];
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    
    // Password strength validation
    if (formData.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.push("Password must contain at least one uppercase letter, one lowercase letter, and one number");
    }
    
    // Required fields
    if (!formData.name.trim()) errors.push("Full name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    if (!formData.password.trim()) errors.push("Password is required");
    if (!formData.phone.trim()) errors.push("Phone number is required");
    if (!formData.speciality.trim()) errors.push("Specialization is required");
    if (!formData.department.trim()) errors.push("Department is required");
    if (!formData.licenseNumber.trim()) errors.push("License number is required");
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setMessage(validationErrors.join(". "));
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Add profile photo if selected
      if (profilePhoto) {
        formDataToSend.append('profilePhoto', profilePhoto);
      }

      const response = await apiFetch("/api/admin-profiles/add-doctor", {
        method: "POST",
        body: formDataToSend,
      });

      console.log("Doctor addition response:", response);

      setMessage("Doctor added successfully! Welcome email sent to doctor.");
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        speciality: "",
        department: "",
        licenseNumber: "",
        degree: "",
        experience: "",
        about: "",
        fees: ""
      });
      setProfilePhoto(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
      
      if (onDoctorAdded) {
        onDoctorAdded();
      }
    } catch (error) {
      setMessage(error.message || "Failed to add doctor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
      <h3 className="mb-6 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Add New Doctor
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter doctor's full name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter password (min 8 chars, uppercase, lowercase, number)"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Specialization *
            </label>
            <input
              type="text"
              name="speciality"
              value={formData.speciality}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Cardiology, Neurology"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Department *
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Internal Medicine, Surgery"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              License Number *
            </label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter medical license number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Degree
            </label>
            <input
              type="text"
              name="degree"
              value={formData.degree}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., MD, MBBS"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Experience (Years)
            </label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Years of experience"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Consultation Fees
            </label>
            <input
              type="number"
              name="fees"
              value={formData.fees}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Fees in euros"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/90">
            Profile Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:text-white"
          />
          {profilePhoto && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              Selected: {profilePhoto.name}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/90">
            About Doctor
          </label>
          <textarea
            name="about"
            value={formData.about}
            onChange={handleInputChange}
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:text-white"
            placeholder="Brief description about the doctor"
          />
        </div>

        {message && (
          <div className={`rounded-lg p-3 ${
            message.includes("successfully") 
              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
        >
          {loading ? "Adding Doctor..." : "Add Doctor"}
        </button>
      </form>
    </div>
  );
}