import React, { useState, useEffect } from 'react';
import { getDoctors, getAvailableSlots } from '../../services/appointmentService';
import LoadingSpinner from '../common/LoadingSpinner';

const AppointmentForm = ({ onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    doctor_id: '',
    scheduled_for: '',
    reason: ''
  });
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [errors, setErrors] = useState({});
  const [fetchingSlots, setFetchingSlots] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDate && formData.doctor_id) {
      fetchAvailableSlots();
    }
  }, [selectedDate, formData.doctor_id]);

  const fetchDoctors = async () => {
    try {
      const doctorsList = await getDoctors();
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !formData.doctor_id) return;
    
    try {
      setFetchingSlots(true);
      const slots = await getAvailableSlots(formData.doctor_id, selectedDate);
      setAvailableSlots(slots.available_slots || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.doctor_id) {
      newErrors.doctor_id = 'Please select a doctor';
    }
    
    if (!formData.scheduled_for) {
      newErrors.scheduled_for = 'Please select a date and time';
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Please provide a reason for the visit';
    } else if (formData.reason.trim().length < 5) {
      newErrors.reason = 'Reason must be at least 5 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Can't book for today
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Can book up to 3 months ahead
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Doctor Selection */}
      <div>
        <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700 mb-2">
          Select Doctor *
        </label>
        <select
          id="doctor_id"
          name="doctor_id"
          value={formData.doctor_id}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.doctor_id ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Choose a doctor...</option>
          {doctors.map(doctor => (
            <option key={doctor._id} value={doctor._id}>
              Dr. {doctor.name} - {doctor.specialization || 'General Medicine'}
            </option>
          ))}
        </select>
        {errors.doctor_id && (
          <p className="mt-1 text-sm text-red-600">{errors.doctor_id}</p>
        )}
      </div>

      {/* Date Selection */}
      <div>
        <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700 mb-2">
          Select Date *
        </label>
        <input
          type="date"
          id="selectedDate"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={getMinDate()}
          max={getMaxDate()}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Time Slot Selection */}
      {selectedDate && formData.doctor_id && (
        <div>
          <label htmlFor="scheduled_for" className="block text-sm font-medium text-gray-700 mb-2">
            Select Time Slot *
          </label>
          {fetchingSlots ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-500">Loading available slots...</span>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    scheduled_for: slot.time
                  }))}
                  className={`p-3 text-sm border rounded-lg transition-colors ${
                    formData.scheduled_for === slot.time
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {slot.formatted}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No available slots for the selected date. Please choose another date.
            </p>
          )}
          {errors.scheduled_for && (
            <p className="mt-1 text-sm text-red-600">{errors.scheduled_for}</p>
          )}
        </div>
      )}

      {/* Reason for Visit */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Visit *
        </label>
        <textarea
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          rows={4}
          placeholder="Please describe the reason for your visit..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.reason ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Please provide a detailed description of your symptoms or reason for the appointment.
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.doctor_id || !formData.scheduled_for || !formData.reason.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Booking...</span>
            </div>
          ) : (
            'Book Appointment'
          )}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;