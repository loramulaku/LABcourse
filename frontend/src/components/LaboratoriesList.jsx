// src/components/LaboratoriesList.jsx
import React, { useEffect, useState } from "react";
import { API_URL } from "../api";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";

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
          console.log('✅ Laboratories loaded:', data.length);
          setLaboratories(data);
        }
      } catch (error) {
        console.error("Error fetching laboratories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLaboratories();
  }, []);

  if (loading) {
    return (
      <div className="mx-4 sm:mx-[10%]">
        <div className="flex flex-col items-center justify-center min-h-screen py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading laboratories...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="mx-4 sm:mx-[10%]">
      {/* Header Section */}
      <div className="text-center my-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-800 mb-4">
          Medical Laboratories
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Browse through our trusted medical laboratories and book your analysis appointment with ease.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {laboratories.map((lab) => (
          <div
            key={lab.id}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden group hover:-translate-y-1"
            onClick={() => navigate(`/laboratory/${lab.id}/request`)}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-4 group-hover:bg-opacity-20 transition-all">
                  <span className="text-3xl">🔬</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 group-hover:text-primary transition-colors">
                    {lab.name}
                  </h2>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Available</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2 mt-0.5">📍</span>
                  <p className="text-gray-600 text-sm flex-1">{lab.address || 'Address not provided'}</p>
                </div>

                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">📞</span>
                  <p className="text-gray-600 text-sm">{lab.phone || 'N/A'}</p>
                </div>

                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">✉️</span>
                  <p className="text-gray-600 text-sm truncate">{lab.email || 'N/A'}</p>
                </div>
              </div>

              {lab.description && (
                <div className="mb-4 border-t border-gray-100 pt-3">
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {lab.description}
                  </p>
                </div>
              )}

              {lab.working_hours && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400">🕒</span>
                    <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Working Hours
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">{lab.working_hours}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-primary font-medium group-hover:underline">
                  Book Analysis
                </span>
                <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center group-hover:bg-opacity-20 transition-all">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}

        {laboratories.length === 0 && (
          <div className="text-center py-20 col-span-full">
            <div className="text-gray-300 text-8xl mb-6">🔬</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-3">
              No Laboratories Available
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              There are currently no laboratories registered in the system. Please check back later.
            </p>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default LaboratoriesList;
