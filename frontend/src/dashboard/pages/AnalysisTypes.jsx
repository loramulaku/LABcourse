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
    <div className="w-full max-w-full mx-0 space-y-8">
      <PageMeta title="Analysis Types" description="Manage analysis types" />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Add Analysis Type
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Create a new analysis type</p>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Analysis Name"
            required
          />
          <select
            name="laboratory_id"
            value={form.laboratory_id}
            onChange={onChange}
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Unit (e.g., mg/dL)"
          />
          <input
            name="price"
            value={form.price}
            onChange={onChange}
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Price"
            type="number"
            step="0.01"
          />
          <input
            name="normal_range"
            value={form.normal_range}
            onChange={onChange}
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white col-span-2"
            placeholder="Normal range (e.g., 70-110)"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white col-span-2"
            rows="3"
            placeholder="Description"
          />
          <button
            type="submit"
            className="col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Add Analysis Type
          </button>
        </form>
      </div>
    </div>
  );
}
