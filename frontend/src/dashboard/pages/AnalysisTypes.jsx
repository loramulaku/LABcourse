import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import apiFetch, { API_URL } from "../../api";

export default function AnalysisTypes() {
  const [labs, setLabs] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    normal_range: "",
    unit: "",
    price: "",
    laboratory_id: "",
  });
  const [loadingLabs, setLoadingLabs] = useState(true);

  useEffect(() => {
    const loadLabs = async () => {
      try {
        setLoadingLabs(true);
        const data = await apiFetch(
          `${API_URL}/api/laboratories/_dropdown/minimal`,
        );
        setLabs(data);
      } catch (e) {
        console.error(e);
        alert(e.error || e.message || "Failed to load laboratories list");
      } finally {
        setLoadingLabs(false);
      }
    };
    loadLabs();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`${API_URL}/api/laboratories/analysis-types`, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          price: form.price === "" ? null : Number(form.price),
          laboratory_id: form.laboratory_id ? Number(form.laboratory_id) : null,
        }),
      });
      alert("Analysis type created");
      setForm({
        name: "",
        description: "",
        normal_range: "",
        unit: "",
        price: "",
        laboratory_id: "",
      });
    } catch (e) {
      console.error(e);
      alert(e.error || e.message || "Failed to create analysis type");
    }
  };

  return (
    <div>
      <PageMeta title="Analysis Types" description="Manage analysis types" />
      <PageBreadcrumb pageTitle="Analysis Types" />

      <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="p-2 rounded bg-gray-800 text-white"
            placeholder="Name"
            required
          />
          <select
            name="laboratory_id"
            value={form.laboratory_id}
            onChange={onChange}
            className="p-2 rounded bg-gray-800 text-white"
            required
            disabled={loadingLabs}
          >
            <option value="">
              {loadingLabs ? "Loading labs..." : "Select Laboratory"}
            </option>
            {labs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <input
            name="unit"
            value={form.unit}
            onChange={onChange}
            className="p-2 rounded bg-gray-800 text-white"
            placeholder="Unit (e.g., mg/dL)"
          />
          <input
            name="price"
            value={form.price}
            onChange={onChange}
            className="p-2 rounded bg-gray-800 text-white"
            placeholder="Price"
            type="number"
            step="0.01"
          />
          <input
            name="normal_range"
            value={form.normal_range}
            onChange={onChange}
            className="p-2 rounded bg-gray-800 text-white col-span-2"
            placeholder="Normal range (e.g., 70-110)"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="p-2 rounded bg-gray-800 text-white col-span-2"
            rows="3"
            placeholder="Description"
          />
          <button
            type="submit"
            className="col-span-2 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 transition-colors"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
