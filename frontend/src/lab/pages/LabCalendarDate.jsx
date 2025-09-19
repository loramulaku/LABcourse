import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiFetch, { API_URL } from "../../api";

export default function LabCalendarDate() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    result_note: "",
    result_pdf: null
  });

  // Separate appointments by status
  const unconfirmedRequests = appointments.filter(apt => apt.status === 'unconfirmed');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'pending_result');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

  useEffect(() => {
    loadAppointments();
  }, [date]);

  const loadAppointments = async () => {
    try {
      const data = await apiFetch(`${API_URL}/api/laboratories/dashboard/appointments-by-date/${date}`);
      setAppointments(data || []);
    } catch (error) {
      console.error(error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await apiFetch(`${API_URL}/api/laboratories/dashboard/update-status/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await loadAppointments();
      alert(`Status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  const handleUploadResult = async () => {
    if (!selectedAppointment) return;
    
    try {
      const formData = new FormData();
      formData.append('result_note', uploadForm.result_note);
      if (uploadForm.result_pdf) {
        formData.append('result_pdf', uploadForm.result_pdf);
      }

      await apiFetch(`${API_URL}/api/laboratories/dashboard/upload-result/${selectedAppointment.id}`, {
        method: 'POST',
        body: formData
      });

      setShowUploadModal(false);
      setUploadForm({ result_note: "", result_pdf: null });
      setSelectedAppointment(null);
      await loadAppointments();
      alert('Result uploaded successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to upload result');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      unconfirmed: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Unconfirmed' },
      pending_result: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending Result' },
      completed: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.unconfirmed;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/lab/calendar')}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Calendar
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Appointments for {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <p className="text-gray-600">{appointments.length} appointment(s) scheduled</p>
          </div>
        </div>
      </div>

      {/* Unconfirmed Requests Section */}
      {unconfirmedRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Unconfirmed Requests ({unconfirmedRequests.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">Requests waiting for confirmation</p>
          </div>
          <div className="divide-y divide-gray-200">
            {unconfirmedRequests.map((appointment) => (
              <div
                key={appointment.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  selectedAppointment?.id === appointment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="text-lg font-semibold text-gray-800">
                        {formatTime(appointment.appointment_date)} - {appointment.patient_name}
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-800">{appointment.analysis_name}</p>
                        <p className="text-gray-600">{appointment.patient_email}</p>
                        {appointment.patient_phone && (
                          <p className="text-gray-600">{appointment.patient_phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Price: ${appointment.price}</p>
                        <p className="text-sm text-gray-500">Requested: {new Date(appointment.appointment_date).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => updateStatus(appointment.id, 'pending_result')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(appointment.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Appointments Section */}
      {confirmedAppointments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Confirmed Appointments ({confirmedAppointments.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">Confirmed appointments ready for results</p>
          </div>
          <div className="divide-y divide-gray-200">
            {confirmedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  selectedAppointment?.id === appointment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="text-lg font-semibold text-gray-800">
                        {formatTime(appointment.appointment_date)} - {appointment.patient_name}
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-800">{appointment.analysis_name}</p>
                        <p className="text-gray-600">{appointment.patient_email}</p>
                        {appointment.patient_phone && (
                          <p className="text-gray-600">{appointment.patient_phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Price: ${appointment.price}</p>
                        <p className="text-sm text-gray-500">Confirmed: {new Date(appointment.appointment_date).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => handleUploadClick(appointment)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Upload Result
                    </button>
                    <button
                      onClick={() => updateStatus(appointment.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Appointments Section */}
      {completedAppointments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completed Appointments ({completedAppointments.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">Results ready for download</p>
          </div>
          <div className="divide-y divide-gray-200">
            {completedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  selectedAppointment?.id === appointment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="text-lg font-semibold text-gray-800">
                        {formatTime(appointment.appointment_date)} - {appointment.patient_name}
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-800">{appointment.analysis_name}</p>
                        <p className="text-gray-600">{appointment.patient_email}</p>
                        {appointment.patient_phone && (
                          <p className="text-gray-600">{appointment.patient_phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Price: ${appointment.price}</p>
                        <p className="text-sm text-gray-500">Completed: {new Date(appointment.appointment_date).toLocaleString()}</p>
                        {appointment.result_note && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Result Note:</strong> {appointment.result_note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-6">
                    {appointment.result_pdf_path && (
                      <a
                        href={`${API_URL}/${appointment.result_pdf_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-center"
                      >
                        View Result
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No appointments message */}
      {appointments.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">No appointments for this date</p>
          </div>
        </div>
      )}

      {/* Upload Result Modal */}
      {showUploadModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Upload Result for {selectedAppointment.patient_name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result Note (Optional)
                </label>
                <textarea
                  value={uploadForm.result_note}
                  onChange={(e) => setUploadForm({ ...uploadForm, result_note: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add any notes about the results..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result PDF (Required)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadForm({ ...uploadForm, result_pdf: e.target.files[0] })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Only PDF files are allowed</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadForm({ result_note: "", result_pdf: null });
                  setSelectedAppointment(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadResult}
                disabled={!uploadForm.result_pdf}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Upload Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
