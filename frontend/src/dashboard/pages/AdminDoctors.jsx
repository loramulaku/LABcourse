import React, { useRef, useState } from "react";
import apiFetch, { API_URL } from "../../api";

export default function AdminDoctors() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    speciality: "",
    degree: "",
    experience: "",
    about: "",
    fees: "",
    address_line1: "",
    address_line2: "",
  });
  const [image, setImage] = useState(null);
  const fileRef = useRef(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    for (let key in form) fd.append(key, form[key]);
    if (image) fd.append("image", image);

    try {
      const data = await apiFetch(`${API_URL}/api/doctors`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      console.log("Doctor saved:", data);
      alert("Doctor saved");
      setForm({
        name: "",
        email: "",
        password: "",
        speciality: "",
        degree: "",
        experience: "",
        about: "",
        fees: "",
        address_line1: "",
        address_line2: "",
      });
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert(err?.error || "Error saving doctor");
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
          placeholder="Name"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          onChange={onChange}
        />
        <input
          name="email"
          placeholder="Email"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          onChange={onChange}
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          onChange={onChange}
        />
        <select
          name="speciality"
          value={form.speciality}
          onChange={onChange}
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select Speciality</option>
          <option value="General physician">General physician</option>
          <option value="Gynecologist">Gynecologist</option>
          <option value="Dermatologist">Dermatologist</option>
          <option value="Pediatricians">Pediatricians</option>
          <option value="Neurologist">Neurologist</option>
          <option value="Gastroenterologist">Gastroenterologist</option>
        </select>
        <input
          name="degree"
          placeholder="Degree"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          onChange={onChange}
        />
        <div className="relative">
          <input
            type="number"
            min="0"
            name="experience"
            placeholder="Experience"
            className="p-3 pr-20 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-full"
            value={form.experience.match(/\d+/)?.[0] || ""}
            onChange={(e) => {
              const years = e.target.value;
              setForm({ ...form, experience: years ? `${years} Years` : "" });
            }}
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
            placeholder="Fees"
            className="pl-7 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-full"
            value={form.fees}
            onChange={onChange}
          />
        </div>
        <input
          name="address_line1"
          placeholder="Address Line 1"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          onChange={onChange}
        />
        <input
          name="address_line2"
          placeholder="Address Line 2"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          onChange={onChange}
        />
        <textarea
          name="about"
          placeholder="About"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white col-span-2"
          onChange={onChange}
        ></textarea>
        <input
          ref={fileRef}
          name="image"
          type="file"
          accept="image/*"
          className="col-span-2 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button type="submit" className="col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
          Save Doctor
        </button>
      </form>
      </div>
    </div>
  );
}
