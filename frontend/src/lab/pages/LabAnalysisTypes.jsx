import React, { useEffect, useState } from "react";
import apiFetch, { API_URL } from "../../api";

export default function LabAnalysisTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", normal_range: "", unit: "", price: "" });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/my-analysis-types`);
      setTypes(data);
    } catch (e) {
      console.error(e);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiFetch(`${API_URL}/api/laboratories/dashboard/my-analysis-types/${editing}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...form,
            price: form.price === "" ? null : Number(form.price),
          }),
        });
        setEditing(null);
      } else {
        await apiFetch(`${API_URL}/api/laboratories/dashboard/my-analysis-types`, {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            price: form.price === "" ? null : Number(form.price),
          }),
        });
      }
      setForm({ name: "", description: "", normal_range: "", unit: "", price: "" });
      await load();
    } catch (e) {
      console.error(e);
      alert(e.error || e.message || 'Failed to save');
    }
  };

  const startEdit = (type) => {
    setEditing(type.id);
    setForm({
      name: type.name || "",
      description: type.description || "",
      normal_range: type.normal_range || "",
      unit: type.unit || "",
      price: type.price || "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: "", description: "", normal_range: "", unit: "", price: "" });
  };

  const remove = async (id) => {
    try {
      await apiFetch(`${API_URL}/api/laboratories/dashboard/my-analysis-types/${id}`, { method: 'DELETE' });
      setTypes((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h3 className="mb-6 text-2xl font-bold text-green-800 flex items-center">
        <img src="/src/lab/labicon/3.jpg" alt="Analysis" className="w-8 h-8 mr-3" />
        Add / Manage Analysis Types
      </h3>

      <form onSubmit={submit} className="mb-8 grid grid-cols-2 gap-4 text-sm bg-green-50 p-6 rounded-xl border border-green-200">
        <input name="name" value={form.name} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" placeholder="Name" required />
        <input name="unit" value={form.unit} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" placeholder="Unit (e.g., mg/dL)" />
        <input name="price" value={form.price} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" placeholder="Price" type="number" step="0.01" />
        <input name="normal_range" value={form.normal_range} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all col-span-2" placeholder="Normal range (e.g., 70-110)" />
        <textarea name="description" value={form.description} onChange={onChange} className="p-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all col-span-2" rows="3" placeholder="Description" />
        <div className="col-span-2 flex gap-3">
          <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl">
            {editing ? 'Update Analysis Type' : 'Add Analysis Type'}
          </button>
          {editing && (
            <button type="button" onClick={cancelEdit} className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 font-semibold">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-sm text-center">Loading analysis types...</div>
      ) : (
        <div className="space-y-3 text-sm">
          {types.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-green-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
              <div>
                <p className="font-semibold text-green-800">{t.name}</p>
                <p className="text-green-600">{t.unit || '-'} • {t.normal_range || '-'} • {t.price != null ? `${t.price}€` : '-'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(t)} className="rounded-lg border border-green-300 px-4 py-2 hover:bg-green-50 text-green-600 font-medium transition-all">Edit</button>
                <button onClick={() => remove(t.id)} className="rounded-lg border border-red-300 px-4 py-2 hover:bg-red-50 text-red-600 font-medium transition-all">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


