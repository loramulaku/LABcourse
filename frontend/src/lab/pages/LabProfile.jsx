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
    <div>
      <h3 className="mb-6 text-2xl font-bold text-green-800 flex items-center">
        <img src="/src/lab/labicon/5.jpg" alt="Profile" className="w-8 h-8 mr-3" />
        My Profile
      </h3>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4 text-sm">
        <input name="name" value={form.name} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" placeholder="Laboratory Name" />
        <input name="login_email" value={form.login_email} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" placeholder="Login Email" type="email" />
        <input name="address" value={form.address} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" placeholder="Address" />
        <input name="phone" value={form.phone} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" placeholder="Phone" />
        <input name="contact_email" value={form.contact_email} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" placeholder="Contact Email" type="email" />
        <input name="working_hours" value={form.working_hours} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" placeholder="Working Hours" />
        <textarea name="description" value={form.description} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all col-span-2" rows="4" placeholder="Description" />
        <div className="col-span-2">
          <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}


