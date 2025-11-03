import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { API_URL, getAccessToken } from "../api";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [searchParams] = useSearchParams();
  const highlightedRef = useRef(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    // Scroll to highlighted appointment if specified in URL
    const highlightId = searchParams.get('highlight');
    if (highlightId && highlightedRef.current) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 500);
    }
  }, [appointments, searchParams]);

  const fetchAppointments = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Please log in to view your appointments");
        return;
      }

      const response = await fetch(`${API_URL}/api/appointments/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePayNow = async (appointment) => {
    // Prevent multiple clicks
    if (paymentLoading === appointment.id) {
      return;
    }

    setPaymentLoading(appointment.id);

    try {
      // Check if payment link exists in the appointment data
      if (appointment.payment_link) {
        // Redirect to Stripe payment link
        window.location.href = appointment.payment_link;
      } else {
        // Payment link not found - need to regenerate
        console.error('Payment link missing for appointment:', appointment.id);
        
        toast.error(
          "Payment link is missing. Please ask the doctor to re-approve your appointment.",
          {
            autoClose: 5000,
            toastId: `payment-error-${appointment.id}` // Prevent duplicate toasts
          }
        );
        
        setPaymentLoading(null);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("An error occurred. Please try again.", {
        toastId: `payment-error-${appointment.id}`
      });
      setPaymentLoading(null);
    }
  };

  const getTimeRemaining = (deadline) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-indigo-100 text-indigo-800";
      case "CANCELLED":
      case "DECLINED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Appointments
              </h1>
              <p className="mt-2 text-gray-600">
                View and manage your upcoming appointments
              </p>
            </div>
            <div className="flex space-x-3">
              <a
                href="/my-analyses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                My Analyses
              </a>
              <a
                href="/my-therapies"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                My Therapies
              </a>
            </div>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-6">
              <svg
                className="h-10 w-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't booked any appointments yet.
            </p>
            <a
              href="/doctors"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Book an Appointment
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((appointment) => {
              const isHighlighted = searchParams.get('highlight') === String(appointment.id);
              const isApproved = appointment.status?.toUpperCase() === 'APPROVED';
              const timeLeft = isApproved ? getTimeRemaining(appointment.payment_deadline) : null;
              
              return (
              <div
                key={appointment.id}
                ref={isHighlighted ? highlightedRef : null}
                className={`bg-white shadow rounded-lg p-6 transition-all duration-300 ${
                  isHighlighted ? 'ring-4 ring-blue-500 ring-opacity-50 animate-pulse' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Appointment #{appointment.id}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                      >
                        {appointment.status}
                      </span>
                      {isApproved && timeLeft && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          ⏱️ {timeLeft}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Doctor
                        </p>
                        <p className="text-sm text-gray-900">
                          {appointment.doctor_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.speciality}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Date & Time
                        </p>
                        <p className="text-sm text-gray-900">
                          {formatDate(appointment.scheduled_for)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Reason
                        </p>
                        <p className="text-sm text-gray-900">
                          {appointment.reason}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Amount
                        </p>
                        <p className="text-sm text-gray-900">
                          €{appointment.amount}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: {appointment.payment_status}
                        </p>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Notes
                        </p>
                        <p className="text-sm text-gray-900">
                          {appointment.notes}
                        </p>
                      </div>
                    )}

                    {appointment.therapy_text && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          📋 Doctor's Prescription & Therapy
                        </p>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">
                          {appointment.therapy_text}
                        </p>
                      </div>
                    )}

                    {/* Payment Section for APPROVED appointments */}
                    {isApproved && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h4 className="text-lg font-semibold text-blue-900">
                                Appointment Approved!
                              </h4>
                            </div>
                            <p className="text-sm text-blue-800 mb-3">
                              Your appointment has been approved by the doctor. Please complete the payment within <strong>{timeLeft}</strong> to confirm your appointment.
                            </p>
                            {appointment.payment_deadline && (
                              <p className="text-xs text-blue-600 mb-4">
                                Payment deadline: {formatDate(appointment.payment_deadline)}
                              </p>
                            )}
                            <button
                              onClick={() => handlePayNow(appointment)}
                              disabled={paymentLoading === appointment.id}
                              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-all duration-200 ${
                                paymentLoading === appointment.id
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                              }`}
                            >
                              {paymentLoading === appointment.id ? (
                                <>
                                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                  Pay Now - €{appointment.amount}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pending approval message */}
                    {appointment.status?.toUpperCase() === 'PENDING' && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-yellow-800">
                            Waiting for doctor approval. You'll be notified once the doctor reviews your request.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
