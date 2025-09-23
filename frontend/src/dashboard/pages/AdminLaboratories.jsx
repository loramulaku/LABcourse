import React, { useState } from "react";
import { API_URL } from "../../api";

export default function AdminLaboratories() {
  const [form, setForm] = useState({
    name: "",
    login_email: "",
    password: "",
    address: "",
    phone: "",
    contact_email: "",
    description: "",
    working_hours: "",
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/laboratories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (response.ok) {
        alert("Laboratory added successfully!");
        setForm({
          name: "",
          login_email: "",
          password: "",
          address: "",
          phone: "",
          contact_email: "",
          description: "",
          working_hours: "",
        });
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error adding laboratory");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding laboratory");
    }
  };

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Add Laboratory
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Create a new laboratory facility</p>
        </div>
      </div>
      
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Laboratory Name"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.name}
          onChange={onChange}
          required
        />
        <input
          name="login_email"
          placeholder="Login Email (for authentication)"
          type="email"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.login_email}
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
        <input
          name="contact_email"
          placeholder="Private Contact Email (public)"
          type="email"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.contact_email}
          onChange={onChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone Number"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.phone}
          onChange={onChange}
          required
        />
        <input
          name="address"
          placeholder="Address"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={form.address}
          onChange={onChange}
          required
        />
        <input
          name="working_hours"
          placeholder="Working Hours (e.g., Mon-Fri: 8:00-18:00)"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white col-span-2"
          value={form.working_hours}
          onChange={onChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white col-span-2"
          rows="4"
          value={form.description}
          onChange={onChange}
          required
        />
        <button
          type="submit"
          className="col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Add Laboratory
        </button>
      </form>
      </div>
    </div>
  );
}
