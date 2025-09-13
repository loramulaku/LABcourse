// src/components/AnalysisRequestForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../api';

const AnalysisRequestForm = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookedHours, setBookedHours] = useState([]);
  const [formData, setFormData] = useState({
    analysis_type_id: '',
    appointment_date: '',
    notes: ''
  });
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
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting analysis request:', error);
      setError('Network error. Please try again.');
    }
  };

  const fetchBookedHours = async (date) => {
    if (!date) return;
    try {
      const response = await fetch(`${API_URL}/api/laboratories/${labId}/booked-hours/${date}`);
      if (response.ok) {
        const data = await response.json();
        setBookedHours(data);
      }
    } catch (error) {
      console.error('Error fetching booked hours:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'appointment_date') {
      const dateOnly = value.split('T')[0];
      setSelectedDate(dateOnly);
      fetchBookedHours(dateOnly);
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Check if selected time slot is booked
  const isTimeSlotBooked = (dateTime) => {
    if (!dateTime) return false;
    return bookedSlots.includes(dateTime);
  };

  // Check if all hours are booked for a date
  const isDateFullyBooked = (date) => {
    if (!date || bookedHours.length === 0) return false;
    
    // Generate all possible hours for the day (8 AM to 6 PM)
    const allHours = [];
    for (let hour = 8; hour <= 18; hour++) {
      allHours.push(`${hour.toString().padStart(2, '0')}:00:00`);
    }
    
    // Check if all hours are booked
    return allHours.every(hour => bookedHours.includes(hour));
  };

  // Get available hours for the selected date
  const getAvailableHours = () => {
    if (!selectedDate || bookedHours.length === 0) return [];
    
    const allHours = [];
    for (let hour = 8; hour <= 18; hour++) {
      allHours.push(`${hour.toString().padStart(2, '0')}:00:00`);
    }
    
    return allHours.filter(hour => !bookedHours.includes(hour));
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-blue-100 to-blue-200 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Request Analysis</h1>
      
      {error && (
        <div className="max-w-lg mx-auto mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-lg border border-blue-300">
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
            Preferred Date & Time
          </label>
          <input
            type="datetime-local"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleChange}
            className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${
              isTimeSlotBooked(formData.appointment_date) ? 'border-red-500 bg-red-50' : ''
            }`}
            min={new Date().toISOString().slice(0, 16)}
            required
          />
          {isTimeSlotBooked(formData.appointment_date) && (
            <p className="text-red-600 text-sm mt-1">
              ⚠️ This time slot is already booked. Please choose another time.
            </p>
          )}
        </div>

        {selectedDate && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📅 Available Hours for {new Date(selectedDate).toLocaleDateString()}</h3>
            <div className="grid grid-cols-3 gap-2">
              {getAvailableHours().map((hour, index) => (
                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm text-center">
                  {hour.split(':')[0]}:00
                </span>
              ))}
            </div>
            {bookedHours.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-red-600 mb-1">❌ Booked Hours:</p>
                <div className="grid grid-cols-3 gap-2">
                  {bookedHours.map((hour, index) => (
                    <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm text-center">
                      {hour.split(':')[0]}:00
                    </span>
                  ))}
                </div>
              </div>
            )}
            {isDateFullyBooked(selectedDate) && (
              <p className="text-red-600 text-sm mt-2 font-semibold">
                ⚠️ All hours for this date are booked. Please choose another date.
              </p>
            )}
          </div>
        )}

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

        <button
          type="submit"
          disabled={isTimeSlotBooked(formData.appointment_date)}
          className={`w-full font-bold py-2 px-4 rounded ${
            isTimeSlotBooked(formData.appointment_date)
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {isTimeSlotBooked(formData.appointment_date) ? 'Time Slot Not Available' : 'Submit Request'}
        </button>
      </form>

      {bookedSlots.length > 0 && (
        <div className="max-w-lg mx-auto mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
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