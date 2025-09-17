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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-semibold">Add / Manage Analysis Types</h3>

      <form onSubmit={submit} className="mb-6 grid grid-cols-2 gap-4 text-sm">
        <input name="name" value={form.name} onChange={onChange} className="p-2 rounded border" placeholder="Name" required />
        <input name="unit" value={form.unit} onChange={onChange} className="p-2 rounded border" placeholder="Unit (e.g., mg/dL)" />
        <input name="price" value={form.price} onChange={onChange} className="p-2 rounded border" placeholder="Price" type="number" step="0.01" />
        <input name="normal_range" value={form.normal_range} onChange={onChange} className="p-2 rounded border col-span-2" placeholder="Normal range (e.g., 70-110)" />
        <textarea name="description" value={form.description} onChange={onChange} className="p-2 rounded border col-span-2" rows="3" placeholder="Description" />
        <div className="col-span-2 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {editing ? 'Update' : 'Save'}
          </button>
          {editing && (
            <button type="button" onClick={cancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="rounded border p-3 text-sm">Loading...</div>
      ) : (
        <div className="space-y-2 text-sm">
          {types.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-gray-600">{t.unit || '-'} • {t.normal_range || '-'} • {t.price != null ? `${t.price}€` : '-'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(t)} className="rounded border px-3 py-1 hover:bg-blue-50 text-blue-600">Edit</button>
                <button onClick={() => remove(t.id)} className="rounded border px-3 py-1 hover:bg-red-50 text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


