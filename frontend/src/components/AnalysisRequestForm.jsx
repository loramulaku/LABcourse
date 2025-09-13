// src/components/AnalysisRequestForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../api';
import AnalysisCalendar from './AnalysisCalendar';

const AnalysisRequestForm = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
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

    const fetchBookedSlots = async () => {
      try {
        const response = await fetch(`${API_URL}/api/laboratories/${labId}/booked-slots`);
        if (response.ok) {
          const data = await response.json();
          setBookedSlots(data);
        }
      } catch (error) {
        console.error('Error fetching booked slots:', error);
      }
    };

    fetchAnalysisTypes();
    fetchBookedSlots();
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
        laboratory_id: parseInt(labId) // Ensure labId is an integer
      };
      
      console.log('Sending analysis request:', requestData);
      console.log('Access token:', localStorage.getItem("accessToken"));
      
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
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        
        if (errorData.error === 'TIME_SLOT_BOOKED') {
          setError('Reserved hour');
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
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Request Analysis</h1>
      
      {error && (
        <div className="max-w-4xl mx-auto mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Analysis Type Selection */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Analysis Details</h2>
          
          <form onSubmit={handleSubmit}>
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
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                rows="4"
                placeholder="Any additional information or special requirements..."
              />
            </div>

            {selectedTimeSlot && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  <strong>Selected Time:</strong> {new Date(selectedTimeSlot).toLocaleDateString()} at {new Date(selectedTimeSlot).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedTimeSlot || !formData.analysis_type_id}
              className={`w-full font-bold py-2 px-4 rounded ${
                !selectedTimeSlot || !formData.analysis_type_id
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-700 text-white'
              }`}
            >
              {!selectedTimeSlot ? 'Please Select a Time Slot' : 'Submit Request'}
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

      {bookedSlots.length > 0 && (
        <div className="max-w-6xl mx-auto mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800 mb-2">📅 Recently Booked Time Slots:</h3>
          <div className="text-sm text-yellow-700">
            {bookedSlots.slice(-6).map((slot, index) => (
              <span key={index} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded mr-2 mb-1">
                {new Date(slot).toLocaleDateString()} {new Date(slot).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            ))}
          </div>
          {bookedSlots.length > 6 && (
            <p className="text-xs text-yellow-600 mt-2">
              ... and {bookedSlots.length - 6} more bookings
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisRequestForm;