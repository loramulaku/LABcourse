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
    <div className="p-6 bg-gray-900 rounded-xl shadow-md text-white">
      <h2 className="text-xl font-semibold mb-4">Add Doctor</h2>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Name"
          className="p-2 rounded bg-gray-800"
          onChange={onChange}
        />
        <input
          name="email"
          placeholder="Email"
          className="p-2 rounded bg-gray-800"
          onChange={onChange}
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          className="p-2 rounded bg-gray-800"
          onChange={onChange}
        />
        <select
          name="speciality"
          value={form.speciality}
          onChange={onChange}
          className="p-2 rounded bg-gray-800 text-white"
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
          className="p-2 rounded bg-gray-800"
          onChange={onChange}
        />
        <div className="relative">
          <input
            type="number"
            min="0"
            name="experience"
            placeholder="Experience"
            className="p-2 pr-20 rounded bg-gray-800 w-full"
            value={form.experience.match(/\d+/)?.[0] || ""}
            onChange={(e) => {
              const years = e.target.value;
              setForm({ ...form, experience: years ? `${years} Years` : "" });
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
            Years
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
            €
          </span>
          <input
            type="number"
            step="0.01"
            name="fees"
            placeholder="Fees"
            className="pl-7 p-2 rounded bg-gray-800 w-full"
            value={form.fees}
            onChange={onChange}
          />
        </div>
        <input
          name="address_line1"
          placeholder="Address Line 1"
          className="p-2 rounded bg-gray-800"
          onChange={onChange}
        />
        <input
          name="address_line2"
          placeholder="Address Line 2"
          className="p-2 rounded bg-gray-800"
          onChange={onChange}
        />
        <textarea
          name="about"
          placeholder="About"
          className="p-2 rounded bg-gray-800 col-span-2"
          onChange={onChange}
        ></textarea>
        <input
          ref={fileRef}
          name="image"
          type="file"
          accept="image/*"
          className="col-span-2"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button type="submit" className="col-span-2 bg-blue-600 py-2 rounded">
          Save Doctor
        </button>
      </form>
    </div>
  );
}
