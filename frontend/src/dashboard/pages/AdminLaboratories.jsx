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
    <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl shadow-md text-white">
      <h2 className="text-xl font-semibold mb-4">Add Laboratory</h2>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Laboratory Name"
          className="p-2 rounded bg-gray-800"
          value={form.name}
          onChange={onChange}
          required
        />
        <input
          name="login_email"
          placeholder="Login Email (for authentication)"
          type="email"
          className="p-2 rounded bg-gray-800"
          value={form.login_email}
          onChange={onChange}
          required
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          className="p-2 rounded bg-gray-800"
          value={form.password}
          onChange={onChange}
          required
        />
        <input
          name="contact_email"
          placeholder="Private Contact Email (public)"
          type="email"
          className="p-2 rounded bg-gray-800"
          value={form.contact_email}
          onChange={onChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone Number"
          className="p-2 rounded bg-gray-800"
          value={form.phone}
          onChange={onChange}
          required
        />
        <input
          name="address"
          placeholder="Address"
          className="p-2 rounded bg-gray-800"
          value={form.address}
          onChange={onChange}
          required
        />
        <input
          name="working_hours"
          placeholder="Working Hours (e.g., Mon-Fri: 8:00-18:00)"
          className="p-2 rounded bg-gray-800 col-span-2"
          value={form.working_hours}
          onChange={onChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          className="p-2 rounded bg-gray-800 col-span-2"
          rows="4"
          value={form.description}
          onChange={onChange}
          required
        />
        <button
          type="submit"
          className="col-span-2 bg-indigo-500 py-2 rounded hover:bg-indigo-600 transition-colors"
        >
          Add Laboratory
        </button>
      </form>
    </div>
  );
}
