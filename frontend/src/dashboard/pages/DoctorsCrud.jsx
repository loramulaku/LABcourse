import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { API_URL } from "../../api";
import { useOutletContext } from "react-router-dom";

export default function DoctorsCrud() {
  const [doctors, setDoctors] = useState([]);
  const { searchQuery } = useOutletContext();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);

  const load = async () => {
    try {
      const r = await fetch(`${API_URL}/api/doctors`);
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      const data = await r.json();
      if (Array.isArray(data)) {
        setDoctors(data);
      } else {
        console.warn("Doctors data is not an array:", data);
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      setDoctors([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(doctors)) return [];
    const q = (searchQuery || "").toLowerCase().trim();
    if (!q) return doctors;
    return doctors.filter((d) =>
      [d.name, d.speciality, d.email].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [doctors, searchQuery]);

  const startEdit = async (id) => {
    const r = await fetch(`${API_URL}/api/doctors/${id}`);
    const d = await r.json();
    setEditing(id);
    setForm({ ...d });
    setImage(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({});
    setImage(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
    if (image) fd.append("image", image);
    const r = await fetch(`${API_URL}/api/doctors/${editing}`, {
      method: "PUT",
      body: fd,
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (r.ok) {
      await load();
      cancelEdit();
    } else {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Update failed");
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this doctor?")) return;
    const r = await fetch(`${API_URL}/api/doctors/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (r.ok) load();
    else alert("Delete failed");
  };

  return (
    <div>
      <PageMeta title="Edit & Delete Doctors" description="Manage doctors" />
      <PageBreadcrumb pageTitle="Edit & Delete Doctors" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {!editing ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-gray-600">
                <tr>
                  <th className="py-2 pr-4">Photo</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Speciality</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-gray-200">
                    <td className="py-2 pr-4">
                      <img
                        src={
                          d.image?.startsWith("http")
                            ? d.image
                            : `${API_URL}${d.image || ""}`
                        }
                        alt=""
                        className="w-14 h-14 object-cover rounded"
                      />
                    </td>
                    <td className="py-2 pr-4">{d.name}</td>
                    <td className="py-2 pr-4">{d.speciality}</td>
                    <td className="py-2 pr-4 flex gap-2">
                      <button
                        onClick={() => startEdit(d.id)}
                        className="px-3 py-1 rounded bg-green-600 text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(d.id)}
                        className="px-3 py-1 rounded bg-red-600 text-white"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <form onSubmit={saveEdit} className="grid grid-cols-2 gap-4">
            <input
              name="name"
              value={form.name || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Name"
            />
            <input
              name="email"
              value={form.email || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Email"
            />
            <select
              name="speciality"
              value={form.speciality || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
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
              value={form.degree || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Degree"
            />
            <input
              name="experience"
              value={form.experience || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Experience"
            />
            <input
              name="fees"
              type="number"
              step="0.01"
              value={form.fees || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Fees"
            />
            <input
              name="address_line1"
              value={form.address_line1 || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Address line 1"
            />
            <input
              name="address_line2"
              value={form.address_line2 || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Address line 2"
            />
            <textarea
              name="about"
              value={form.about || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white col-span-2"
              placeholder="About"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="col-span-2"
            />
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
