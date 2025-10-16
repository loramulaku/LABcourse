import React, { useState } from "react";
import { API_URL } from "../../api";

export default function AdminDoctors() {
  const [form, setForm] = useState({
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
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!form.name || !form.email || !form.password) {
      alert("Please fill in all required fields: Name, Email, and Password");
      return;
    }

    try {
      // Use FormData if there's an image, otherwise JSON
      let requestBody;
      let headers = {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      };

      if (imageFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('image', imageFile);
        Object.keys(form).forEach(key => {
          formData.append(key, form[key]);
        });
        requestBody = formData;
        // Don't set Content-Type header - browser will set it with boundary
      } else {
        // Use JSON
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(form);
      }

      const response = await fetch(`${API_URL}/api/doctors`, {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: requestBody,
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Doctor added successfully!");
        // Reset form
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
        setImageFile(null);
        setImagePreview(null);
      } else {
        // Show detailed error message
        const errorMsg = data.details 
          ? `${data.error}: ${Array.isArray(data.details) ? data.details.join(', ') : data.details}`
          : data.error || "Error adding doctor";
        alert(errorMsg);
      }
    } catch (err) {
      console.error("Error adding doctor:", err);
      alert("Network error: Could not connect to server. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Add Doctor
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Create a new doctor profile</p>
        </div>
      </div>
      
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Doctor Name"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.name}
          onChange={onChange}
          required
        />
        <input
          name="email"
          placeholder="Email Address"
          type="email"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.email}
          onChange={onChange}
          required
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.password}
          onChange={onChange}
          required
        />
        <select
          name="specialization"
          value={form.specialization}
          onChange={onChange}
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
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
        <input
          name="degree"
          placeholder="Degree (e.g., MD, MBBS)"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.degree}
          onChange={onChange}
        />
        <div className="relative">
          <input
            type="number"
            min="0"
            name="experience_years"
            placeholder="Experience"
            className="p-3 pr-20 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-full"
            value={form.experience_years}
            onChange={onChange}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            Years
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            €
          </span>
          <input
            type="number"
            step="0.01"
            name="fees"
            placeholder="Consultation Fees"
            className="pl-7 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-full"
            value={form.fees}
            onChange={onChange}
          />
        </div>
        <input
          name="address_line1"
          placeholder="Address Line 1"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.address_line1}
          onChange={onChange}
        />
        <input
          name="address_line2"
          placeholder="Address Line 2"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.address_line2}
          onChange={onChange}
        />
        <textarea
          name="about"
          placeholder="About Doctor"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white col-span-2"
          rows="4"
          value={form.about}
          onChange={onChange}
        />
        
        {/* Image Upload */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Doctor Profile Image (Optional)
          </label>
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900 dark:file:text-blue-300
                  cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
            {imagePreview && (
              <div className="flex-shrink-0">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                />
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2 flex items-center space-x-3">
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
        <button
          type="submit"
          className="col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Add Doctor
        </button>
      </form>
      </div>
    </div>
  );
}