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

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/doctors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (response.ok) {
        alert("Doctor added successfully!");
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
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error adding doctor");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding doctor");
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