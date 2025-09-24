import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { API_URL } from "../../api";
import { useOutletContext } from "react-router-dom";

export default function LaboratoriesCrud() {
  const [laboratories, setLaboratories] = useState([]);
  const { searchQuery } = useOutletContext();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/laboratories`);
      const data = await response.json();
      setLaboratories(data);
    } catch (error) {
      console.error("Error loading laboratories:", error);
      alert("Error loading laboratories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim();
    if (!q) return laboratories;
    return laboratories.filter((lab) =>
      [
        lab.name,
        lab.address,
        lab.contact_email,
        lab.phone,
        lab.login_email,
      ].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [laboratories, searchQuery]);

  const startEdit = async (id) => {
    const lab = laboratories.find((l) => l.id === id);
    if (lab) {
      setEditing(id);
      setForm({ ...lab });
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({});
  };

  const saveEdit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/laboratories/${editing}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (response.ok) {
        await load();
        cancelEdit();
        alert("Laboratory updated successfully!");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Update failed");
      }
    } catch (error) {
      console.error("Error updating laboratory:", error);
      alert("Update failed");
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this laboratory? This action cannot be undone."))
      return;

    try {
      const response = await fetch(`${API_URL}/api/laboratories/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        await load();
        alert("Laboratory deleted successfully!");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting laboratory:", error);
      alert("Delete failed");
    }
  };

  if (loading) {
    return (
      <div>
        <PageMeta
          title="Laboratories"
          description="Manage laboratories"
        />
        <PageBreadcrumb pageTitle="Laboratories" />
        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Laboratories"
        description="Manage laboratories"
      />
      <PageBreadcrumb pageTitle="Laboratories" />

      <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {!editing ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-gray-600">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Login Email</th>
                  <th className="py-2 pr-4">Address</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Contact Email</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lab) => (
                  <tr key={lab.id} className="border-t border-gray-200">
                    <td className="py-2 pr-4 font-medium">{lab.name}</td>
                    <td className="py-2 pr-4">{lab.login_email}</td>
                    <td className="py-2 pr-4">{lab.address}</td>
                    <td className="py-2 pr-4">{lab.phone}</td>
                    <td className="py-2 pr-4">{lab.contact_email}</td>
                    <td className="py-2 pr-4 flex gap-2">
                      <button
                        onClick={() => startEdit(lab.id)}
                        className="px-3 py-1 rounded bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(lab.id)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No laboratories found.</p>
              </div>
            )}
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
              placeholder="Laboratory Name"
              required
            />
            <input
              name="login_email"
              value={form.login_email || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Login Email"
              type="email"
              required
            />
            <input
              name="password"
              value={form.password || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="New Password (leave blank to keep)"
              type="password"
            />
            <input
              name="contact_email"
              value={form.contact_email || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Contact Email"
              type="email"
              required
            />
            <input
              name="phone"
              value={form.phone || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Phone"
              required
            />
            <input
              name="address"
              value={form.address || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="Address"
              required
            />
            <input
              name="working_hours"
              value={form.working_hours || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white col-span-2"
              placeholder="Working Hours"
              required
            />
            <textarea
              name="description"
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className="p-2 rounded bg-gray-800 text-white col-span-2"
              placeholder="Description"
              rows="4"
              required
            />
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
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
