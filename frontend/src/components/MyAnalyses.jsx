// src/components/MyAnalyses.jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';

const MyAnalyses = () => {
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    const fetchMyAnalyses = async () => {
      try {
        const response = await fetch(`${API_URL}/api/laboratories/my-analyses`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAnalyses(data);
        }
      } catch (error) {
        console.error('Error fetching analyses:', error);
      }
    };

    fetchMyAnalyses();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Analyses</h1>
      <div className="grid gap-6">
        {analyses.map((analysis) => (
          <div key={analysis.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">{analysis.analysis_name}</h2>
                <p className="text-gray-600">Laboratory: {analysis.laboratory_name}</p>
                <p className="text-gray-600">
                  Appointment: {new Date(analysis.appointment_date).toLocaleString()}
                </p>
                <p className="text-gray-600">Status: 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                    analysis.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {analysis.status}
                  </span>
                </p>
              </div>
            </div>

            {analysis.status === 'completed' && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Results:</h3>
                <p>{analysis.result}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Completed on: {new Date(analysis.completion_date).toLocaleString()}
                </p>
              </div>
            )}

            {analysis.notes && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Notes:</h3>
                <p className="text-gray-700">{analysis.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyAnalyses;