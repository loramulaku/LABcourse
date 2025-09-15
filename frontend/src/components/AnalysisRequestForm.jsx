// src/components/AnalysisRequestForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../api';
import AnalysisCalendar from './AnalysisCalendar';

const AnalysisRequestForm = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({
    analysis_type_id: '',
    appointment_date: '',
    notes: ''
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [error, setError] = useState('');

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
    setError('');
    
    if (!selectedTimeSlot) {
      setError('Please select a time slot from the calendar.');
      return;
    }
    
    try {
      const requestData = {
        ...formData,
        appointment_date: selectedTimeSlot,
        laboratory_id: parseInt(labId)
      };
      
      console.log('Sending analysis request:', requestData);
      
      const response = await fetch(`${API_URL}/api/laboratories/request-analysis`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("accessToken")}` 
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        navigate('/my-analyses');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        
        if (errorData.error === 'TIME_SLOT_BOOKED') {
          setError('This time slot is no longer available. Please select another time slot.');
        } else {
          setError(errorData.error || errorData.details || 'Failed to submit request');
        }
      }
    } catch (error) {
      console.error('Error submitting analysis request:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(''); // Reset time slot when date changes
  };

  const handleTimeSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setError(''); // Clear any error messages when a valid time slot is selected
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-blue-100 to-blue-200 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold">Request Laboratory Analysis</h1>
            <p className="text-blue-100 mt-2">Select your preferred date and time for the analysis</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Analysis Details Form */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Analysis Details</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="analysis_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Type *
                    </label>
                    <select
                      id="analysis_type_id"
                      name="analysis_type_id"
                      value={formData.analysis_type_id}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Analysis Type</option>
                      {analysisTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - ${type.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any additional notes or special requirements..."
                    />
                  </div>

                  {selectedTimeSlot && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">
                        Selected Time: {new Date(selectedTimeSlot).toLocaleDateString()} at {new Date(selectedTimeSlot).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                  >
                    Submit Request
                  </button>
                </form>
              </div>

              {/* Calendar Component */}
              <div>
                <AnalysisCalendar
                  labId={labId}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onTimeSelect={handleTimeSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisRequestForm;