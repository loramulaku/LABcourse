import React, { useEffect, useMemo, useState } from "react";
import apiFetch, { API_URL, getAccessToken } from "../../api";

export default function LabProfile() {
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", login_email: "", address: "", phone: "", contact_email: "", description: "", working_hours: "" });

  const token = getAccessToken();

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch current lab info (backend should map current user->laboratory)
        const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/me`);
        setLab(data);
        setForm({
          name: data.name || "",
          login_email: data.login_email || data.email || "",
          address: data.address || "",
          phone: data.phone || "",
          contact_email: data.contact_email || data.email || "",
          description: data.description || "",
          working_hours: data.working_hours || "",
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/laboratories/dashboard/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(form),
      });
      alert("Saved");
    } catch (e) {
      console.error(e);
      alert("Failed to save");
    }
  };

  if (loading) return <div className="rounded-2xl border p-5">Loading...</div>;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-semibold">My Profile</h3>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4 text-sm">
        <input name="name" value={form.name} onChange={onChange} className="p-2 rounded border" placeholder="Laboratory Name" />
        <input name="login_email" value={form.login_email} onChange={onChange} className="p-2 rounded border" placeholder="Login Email" type="email" />
        <input name="address" value={form.address} onChange={onChange} className="p-2 rounded border" placeholder="Address" />
        <input name="phone" value={form.phone} onChange={onChange} className="p-2 rounded border" placeholder="Phone" />
        <input name="contact_email" value={form.contact_email} onChange={onChange} className="p-2 rounded border" placeholder="Contact Email" type="email" />
        <input name="working_hours" value={form.working_hours} onChange={onChange} className="p-2 rounded border" placeholder="Working Hours" />
        <textarea name="description" value={form.description} onChange={onChange} className="p-2 rounded border col-span-2" rows="4" placeholder="Description" />
        <div className="col-span-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
        </div>
      </form>
    </div>
  );
}


