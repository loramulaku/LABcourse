import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { API_URL, getAccessToken } from '../api';

const AppointmentConfirmation = ({ 
  doctor, 
  selectedDate, 
  selectedTime, 
  onBack, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    reason: '',
    phone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for your appointment');
      return;
    }

    try {
      setLoading(true);
      
      const token = getAccessToken();
      if (!token) {
        toast.error('Please log in to book an appointment');
        return;
      }

      // Create the appointment
      const appointmentData = {
        doctor_id: doctor.id,
        scheduled_for: selectedDate.toISOString(),
        reason: formData.reason,
        phone: formData.phone,
        notes: formData.notes
      };

      const res = await fetch(`${API_URL}/api/appointments/create-checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.error === 'TIME_SLOT_BOOKED') {
          toast.error('That time slot was just booked. Please select another time.');
          onBack();
        } else if (res.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else {
          toast.error(errorData.error || 'Failed to create appointment');
        }
        return;
      }

      const data = await res.json();
      console.log('Appointment response:', data);
      
      if (data.url) {
        // Redirect to Stripe checkout
        console.log('Redirecting to Stripe checkout:', data.url);
        toast.info('Redirecting to payment...');
        window.location.href = data.url;
      } else if (data.status === 'confirmed') {
        // Appointment confirmed directly (no payment required)
        console.log('Appointment confirmed directly');
        if (data.payment_required === false) {
          toast.success('Appointment booked successfully! Payment not required.');
        } else {
          toast.success('Appointment booked successfully!');
        }
        // Redirect to appointments page after successful booking
        setTimeout(() => {
          window.location.href = '/my-appointments';
        }, 1500);
        onSuccess();
      } else {
        console.error('Unexpected response:', data);
        toast.error('No checkout URL received from server.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Your Appointment</h2>
        <p className="text-gray-600">Please review your appointment details and complete the form below.</p>
      </div>

      {/* Appointment Summary */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Appointment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Doctor</p>
            <p className="font-medium text-gray-800">{doctor.name}</p>
            <p className="text-sm text-gray-600">{doctor.speciality}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date & Time</p>
            <p className="font-medium text-gray-800">{formatDate(selectedDate)}</p>
            <p className="text-sm text-gray-600">{formatTime(selectedDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fee</p>
            <p className="font-medium text-gray-800">€{doctor.fees || '20.00'}</p>
          </div>
        </div>
      </div>

      {/* Appointment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Your phone number (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Any additional information you'd like to share..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Back to Time Selection
          </button>
          <button
            type="submit"
            disabled={loading || !formData.reason.trim()}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              loading || !formData.reason.trim()
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Book Appointment - €${doctor.fees || '20.00'}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentConfirmation;
