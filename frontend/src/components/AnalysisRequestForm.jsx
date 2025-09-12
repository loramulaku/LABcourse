// src/components/AnalysisRequestForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../api';

const AnalysisRequestForm = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [formData, setFormData] = useState({
    analysis_type_id: '',
    appointment_date: '',
    notes: ''
  });

  useEffect(() => {
    const fetchAnalysisTypes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/laboratories/${labId}/analysis-types`);
        if (response.ok) {
          const data = await response.json();
          setAnalysisTypes(data);
        }
      } catch (error) {
        console.error('Error fetching analysis types:', error);
      }
    };

    fetchAnalysisTypes();
  }, [labId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/laboratories/request-analysis`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("accessToken")}` 
        },
        body: JSON.stringify({
          ...formData,
          laboratory_id: labId
        })
      });

      if (response.ok) {
        navigate('/my-analyses');
      }
    } catch (error) {
      console.error('Error submitting analysis request:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Request Analysis</h1>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Analysis Type
          </label>
          <select
            name="analysis_type_id"
            value={formData.analysis_type_id}
            onChange={handleChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            required
          >
            <option value="">Select Analysis Type</option>
            {analysisTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - ${type.price}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Preferred Date
          </label>
          <input
            type="datetime-local"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            rows="4"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default AnalysisRequestForm;