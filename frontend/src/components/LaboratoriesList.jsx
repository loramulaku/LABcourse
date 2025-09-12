// src/components/LaboratoriesList.jsx
import React, { useEffect, useState } from 'react';
import { API_URL } from '../api';
import { useNavigate } from 'react-router-dom';

const LaboratoriesList = () => {
  const [laboratories, setLaboratories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLaboratories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/laboratories`);
        if (response.ok) {
          const data = await response.json();
          setLaboratories(data);
        }
      } catch (error) {
        console.error('Error fetching laboratories:', error);
      }
    };

    fetchLaboratories();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Medical Laboratories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {laboratories.map((lab) => (
          <div
            key={lab.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/laboratory/${lab.id}/request`)}
          >
            <h2 className="text-xl font-semibold mb-2">{lab.name}</h2>
            <p className="text-gray-600 mb-2">{lab.address}</p>
            <p className="text-gray-600 mb-2">{lab.phone}</p>
            <p className="text-gray-600 mb-4">{lab.email}</p>
            <div className="text-sm text-gray-500">
              <p>Working Hours:</p>
              <p>{lab.working_hours}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LaboratoriesList;