// src/components/LaboratoriesList.jsx
import React, { useEffect, useState } from 'react';
import { API_URL } from '../api';
import { useNavigate } from 'react-router-dom';

const LaboratoriesList = () => {
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLaboratories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/laboratories`);
        if (response.ok) {
          const data = await response.json();
          setLaboratories(data);
        }
      } catch (error) {
        console.error('Error fetching laboratories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLaboratories();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Medical Laboratories</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">Medical Laboratories</h1>
        <p className="text-blue-600 text-lg">Choose a laboratory for your medical analysis</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {laboratories.map((lab) => (
          <div
            key={lab.id}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-blue-200 overflow-hidden group"
            onClick={() => navigate(`/laboratory/${lab.id}/request`)}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                  <span className="text-2xl">🔬</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {lab.name}
                </h2>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2">📍</span>
                  <p className="text-gray-600 text-sm">{lab.address}</p>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">📞</span>
                  <p className="text-gray-600 text-sm">{lab.phone}</p>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">✉️</span>
                  <p className="text-gray-600 text-sm">{lab.email}</p>
                </div>
              </div>

              {lab.description && (
                <div className="mb-4">
                  <p className="text-gray-700 text-sm line-clamp-3">{lab.description}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center mb-1">
                  <span className="text-gray-400 mr-2">🕒</span>
                  <span className="text-sm font-medium text-gray-700">Working Hours</span>
                </div>
                <p className="text-sm text-gray-600">{lab.working_hours}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
                  Book Analysis →
                </span>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600">→</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {laboratories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔬</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Laboratories Available</h2>
          <p className="text-gray-500">There are currently no laboratories registered in the system.</p>
        </div>
      )}
    </div>
  );
};

export default LaboratoriesList;