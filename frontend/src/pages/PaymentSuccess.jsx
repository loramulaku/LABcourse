import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL, getAccessToken } from "../api";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verificationError, setVerificationError] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        navigate("/");
        return;
      }

      try {
        const token = getAccessToken();
        if (!token) {
          toast.error("Please log in to view your appointment");
          navigate("/login");
          return;
        }

        // Verify payment with backend
        const response = await fetch(
          `${API_URL}/api/appointments/verify-payment/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to verify payment");
        }

        const data = await response.json();
        
        if (data.success && data.payment_status === 'paid') {
          setAppointmentDetails(data);
          toast.success(
            "Payment completed successfully! Your appointment has been confirmed."
          );
        } else {
          setVerificationError(true);
          toast.error("Payment verification failed. Please contact support.");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setVerificationError(true);
        toast.error("Failed to verify payment. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Verification Failed
            </h2>
            <p className="text-gray-600 mb-8">
              We couldn't verify your payment. Please contact support or try again.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => navigate("/my-appointments")}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View My Appointments
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Your appointment has been confirmed and payment has been processed
            successfully.
          </p>
          
          {appointmentDetails && (
            <div className="bg-blue-50 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Appointment ID:</span> #{appointmentDetails.appointment_id}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Amount Paid:</span> €{appointmentDetails.amount}
              </p>
              <p className="text-sm text-green-600 font-medium mt-2">
                Status: {appointmentDetails.status}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => navigate("/my-appointments")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View My Appointments
            </button>

            {appointmentDetails?.receipt_url && (
              <button
                onClick={() => window.open(appointmentDetails.receipt_url, "_blank")}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                View Receipt
              </button>
            )}

            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
