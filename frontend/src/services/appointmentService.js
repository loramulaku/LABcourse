const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Get list of doctors (matches AppointmentForm fetchDoctors)
export const getDoctors = async () => {
  try {
    // For now, return mock data - replace with real API call later
    const mockDoctors = [
      { _id: 1, name: 'Dr. John Smith', specialization: 'Cardiology' },
      { _id: 2, name: 'Dr. Sarah Johnson', specialization: 'Pediatrics' },
      { _id: 3, name: 'Dr. Michael Brown', specialization: 'General Medicine' },
      { _id: 4, name: 'Dr. Emily Davis', specialization: 'Dermatology' },
      { _id: 5, name: 'Dr. Robert Wilson', specialization: 'Orthopedics' }
    ];
    
    // When you have backend, uncomment this:
    // return apiCall('/users/doctors');
    
    // For now, simulate API delay and return mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockDoctors;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

// Get available time slots (matches AppointmentForm fetchAvailableSlots)
export const getAvailableSlots = async (doctorId, date) => {
  try {
    // For now, return mock data - replace with real API call later
    const mockSlots = [
      { time: `${date}T09:00:00Z`, hour: 9, formatted: '9:00 - 10:00' },
      { time: `${date}T10:00:00Z`, hour: 10, formatted: '10:00 - 11:00' },
      { time: `${date}T11:00:00Z`, hour: 11, formatted: '11:00 - 12:00' },
      { time: `${date}T14:00:00Z`, hour: 14, formatted: '2:00 - 3:00' },
      { time: `${date}T15:00:00Z`, hour: 15, formatted: '3:00 - 4:00' },
      { time: `${date}T16:00:00Z`, hour: 16, formatted: '4:00 - 5:00' }
    ];
    
    // When you have backend, uncomment this:
    // return apiCall(`/appointments/available-slots/${doctorId}?date=${date}`);
    
    // For now, simulate API delay and return mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    return { available_slots: mockSlots };
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
};

// Create new appointment (for when you add the form submission)
export const createAppointment = async (appointmentData) => {
  try {
    // When you have backend, uncomment this:
    // return apiCall('/appointments/create', {
    //   method: 'POST',
    //   body: JSON.stringify(appointmentData),
    // });
    
    // For now, simulate API call and return mock response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockAppointment = {
      _id: Date.now(),
      ...appointmentData,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    
    return mockAppointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

// Get patient's appointments (for future use)
export const getMyAppointments = async () => {
  try {
    // When you have backend, uncomment this:
    // return apiCall('/appointments/my-appointments');
    
    // For now, return mock data
    const mockAppointments = [
      {
        _id: 1,
        doctor_id: { _id: 2, name: 'Dr. Sarah Johnson', specialization: 'Pediatrics' },
        scheduled_for: '2024-01-20T10:00:00Z',
        reason: 'Regular checkup',
        status: 'CONFIRMED',
        created_at: '2024-01-15T09:00:00Z'
      }
    ];
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockAppointments;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

// Export all functions
export default {
  getDoctors,
  getAvailableSlots,
  createAppointment,
  getMyAppointments
};
