import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL, getAccessToken } from '../../api';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  X
} from 'lucide-react';
import ClinicalAssessmentForm from '../components/ClinicalAssessmentForm';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchAppointmentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/appointment/${id}`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAppointment(data);
      } else {
        toast.error('Failed to load appointment details');
        navigate('/doctor/appointments');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Error loading appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/dashboard/approve/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Appointment approved and payment link sent!');
        fetchAppointmentDetails();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve appointment');
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      toast.error('Error approving appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    const reason = window.prompt('Please provide a reason for declining:');
    if (!reason) return;

    try {
      setActionLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/appointment/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'DECLINED',
          notes: reason
        })
      });

      if (response.ok) {
        toast.success('Appointment declined');
        navigate('/doctor/appointments');
      } else {
        toast.error('Failed to decline appointment');
      }
    } catch (error) {
      console.error('Error declining appointment:', error);
      toast.error('Error declining appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchReceipt = async () => {
    try {
      setLoadingReceipt(true);
      const response = await fetch(`${API_URL}/api/appointments/receipt/${id}`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setReceipt(data);
        setShowReceiptModal(true);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Receipt not available');
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error('Failed to load receipt');
    } finally {
      setLoadingReceipt(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' },
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
      COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completed' },
      DECLINED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const config = {
      unpaid: { icon: AlertCircle, bg: 'bg-red-100', text: 'text-red-800', label: 'Unpaid' },
      paid: { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      refunded: { icon: XCircle, bg: 'bg-gray-100', text: 'text-gray-800', label: 'Refunded' },
      expired: { icon: XCircle, bg: 'bg-orange-100', text: 'text-orange-800', label: 'Expired' },
      failed: { icon: XCircle, bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' }
    };

    const statusConfig = config[paymentStatus] || config.unpaid;
    const Icon = statusConfig.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
        <Icon className="w-4 h-4" />
        <span>{statusConfig.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Appointment not found</p>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Appointments</span>
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-gray-600 mt-1">ID: #{appointment.id}</p>
          </div>
          <div className="flex flex-col space-y-2">
            {getStatusBadge(appointment.status)}
            {getPaymentStatusBadge(appointment.payment_status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Patient Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Name</label>
                <p className="text-gray-900 font-medium">{appointment.patient_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <p className="text-gray-900 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{appointment.patient_email || 'N/A'}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Phone</label>
                <p className="text-gray-900 flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{appointment.patient_phone || 'N/A'}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Address</label>
                <p className="text-gray-900 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{appointment.patient_address || 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Appointment Details</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Date & Time</label>
                <p className="text-gray-900 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{new Date(appointment.scheduled_for).toLocaleString()}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Department</label>
                <p className="text-gray-900">{appointment.department || 'General'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Type</label>
                <p className="text-gray-900">{appointment.appointment_type || 'Consultation'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Duration</label>
                <p className="text-gray-900">30 minutes</p>
              </div>
            </div>

            {appointment.reason && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700">Reason for Visit</label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{appointment.reason}</p>
              </div>
            )}

            {appointment.clinical_assessment && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700">Clinical Assessment</label>
                <p className="text-gray-900 mt-1 p-3 bg-blue-50 rounded-lg">{appointment.clinical_assessment}</p>
              </div>
            )}

            {appointment.therapy_prescribed && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700">Therapy Prescribed</label>
                <p className="text-gray-900 mt-1 p-3 bg-green-50 rounded-lg whitespace-pre-line">{appointment.therapy_prescribed}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Payment</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Amount</label>
                <p className="text-2xl font-bold text-gray-900">€{appointment.amount || '60.00'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <div className="mt-1">
                  {getPaymentStatusBadge(appointment.payment_status)}
                </div>
              </div>
              {appointment.paid_at && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Paid At</label>
                  <p className="text-gray-900">{new Date(appointment.paid_at).toLocaleString()}</p>
                </div>
              )}
              {appointment.payment_link && appointment.payment_status === 'unpaid' && (
                <div className="mt-4">
                  <a
                    href={appointment.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>View Payment Link</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {appointment.status === 'PENDING' && appointment.payment_status === 'unpaid' && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{actionLoading ? 'Processing...' : 'Approve & Send Payment'}</span>
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </>
              )}

              {appointment.status === 'CONFIRMED' && !appointment.requires_admission && appointment.requires_admission !== false && (
                <button
                  onClick={() => setShowAssessmentModal(true)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Clinical Assessment</span>
                </button>
              )}

              {appointment.status === 'CONFIRMED' && appointment.requires_admission === false && appointment.therapy_prescribed && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">✅ Assessment Complete</p>
                  <p className="text-xs text-green-600 mt-1">Therapy prescribed</p>
                </div>
              )}

              {appointment.status === 'CONFIRMED' && appointment.requires_admission === true && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">🏥 Admission Required</p>
                  <p className="text-xs text-blue-600 mt-1">Request sent to IPD</p>
                </div>
              )}

              {/* View Receipt Button - Show for paid appointments */}
              {appointment.payment_status === 'paid' && (
                <button
                  onClick={fetchReceipt}
                  disabled={loadingReceipt}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{loadingReceipt ? 'Loading...' : 'View Receipt'}</span>
                </button>
              )}

              {/* Payment Status Info */}
              {appointment.payment_status !== 'paid' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 font-medium">
                    💳 Payment Status: <span className="capitalize">{appointment.payment_status || 'Unpaid'}</span>
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Receipt will be available after payment is completed
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-xs text-gray-600">{new Date(appointment.created_at).toLocaleString()}</p>
                </div>
              </div>
              {appointment.approved_at && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approved</p>
                    <p className="text-xs text-gray-600">{new Date(appointment.approved_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {appointment.paid_at && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Received</p>
                    <p className="text-xs text-gray-600">{new Date(appointment.paid_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Assessment Modal */}
      {showAssessmentModal && (
        <ClinicalAssessmentForm
          appointment={appointment}
          onClose={() => setShowAssessmentModal(false)}
          onSuccess={() => {
            fetchAppointmentDetails();
            setShowAssessmentModal(false);
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receipt && (
        <>
          {/* Print Styles */}
          <style>{`
            @media print {
              /* Force exact color preservation - CRITICAL */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              /* Remove modal overlay styling but keep it functional */
              .modal-overlay {
                background: white !important;
                position: static !important;
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              
              /* Receipt container - minimal changes to preserve design */
              .receipt-container {
                position: static !important;
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: none !important;
                margin: 0 auto !important;
                padding: 0 !important;
                overflow: visible !important;
                box-shadow: none !important;
                border-radius: 0 !important;
              }
              
              /* Hide ONLY buttons and close icon */
              .no-print,
              button {
                display: none !important;
              }
              
              /* Keep sticky as static to avoid print issues */
              .sticky {
                position: static !important;
              }
              
              /* Preserve all backgrounds and colors */
              .bg-blue-50,
              .bg-green-50,
              .bg-gray-50,
              .bg-gray-100,
              .bg-white,
              .border-blue-200,
              .border-green-200,
              .border-gray-200 {
                background-color: inherit !important;
                border-color: inherit !important;
              }
              
              /* Preserve text colors */
              .text-blue-600,
              .text-green-600,
              .text-gray-900,
              .text-gray-700,
              .text-gray-600,
              .text-red-700,
              .text-green-700 {
                color: inherit !important;
              }
              
              /* Text formatting - preserve line breaks and wrapping */
              .clinical-notes-print {
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
              }
              
              /* Avoid page breaks in critical sections */
              .page-break-avoid,
              .border-2,
              .bg-green-50,
              .bg-blue-50 {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              
              /* Preserve grid layouts */
              .grid,
              .flex {
                display: inherit !important;
              }
              
              /* Preserve spacing */
              .space-y-6 > *,
              .space-y-4 > *,
              .mb-4,
              .mb-3,
              .mb-2 {
                margin-bottom: inherit !important;
              }
              
              .p-6,
              .p-4,
              .p-3,
              .p-2,
              .px-6,
              .py-4 {
                padding: inherit !important;
              }
              
              /* Preserve borders */
              .border,
              .border-b,
              .border-t,
              .border-2 {
                border-width: inherit !important;
                border-color: inherit !important;
              }
              
              /* Page setup */
              @page {
                margin: 1.5cm;
                size: A4 portrait;
              }
              
              /* Ensure body and html don't interfere */
              html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
          `}</style>
          
          {/* Modal Overlay */}
          <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* Receipt Container */}
            <div className="receipt-container bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Receipt</h2>
                <p className="text-sm text-gray-600">Receipt #{receipt.receipt_number}</p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceipt(null);
                }}
                className="text-gray-400 hover:text-gray-600 no-print"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 space-y-5">
              {/* Hospital Header */}
              <div className="text-center border-b-2 border-gray-300 pb-4">
                <h3 className="text-2xl font-bold text-gray-900">{receipt.issuer.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{receipt.issuer.address}</p>
                <p className="text-sm text-gray-600">{receipt.issuer.phone} | {receipt.issuer.email}</p>
                <div className="flex justify-between mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Receipt #:</span>
                    <span className="font-semibold ml-2">{receipt.receipt_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="font-semibold ml-2">{new Date(receipt.receipt_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: PATIENT INFORMATION */}
              <div className="border border-gray-300 rounded-lg p-4 page-break-avoid">
                <h4 className="font-bold text-gray-900 mb-3 text-base border-b pb-2">👤 Patient Information</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Full Name:</span>
                    <span className="ml-2 font-semibold">{receipt.patient.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Appointment ID:</span>
                    <span className="ml-2 font-semibold">#{receipt.appointment.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="ml-2">{receipt.patient.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Phone:</span>
                    <span className="ml-2">{receipt.patient.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Appointment Date:</span>
                    <span className="ml-2 font-semibold">{new Date(receipt.appointment.scheduled_for).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Time:</span>
                    <span className="ml-2 font-semibold">{new Date(receipt.appointment.scheduled_for).toLocaleTimeString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 font-medium">Address:</span>
                    <span className="ml-2">{receipt.patient.address}</span>
                  </div>
                  {receipt.appointment.reason && (
                    <div className="col-span-2 mt-2 pt-2 border-t">
                      <span className="text-gray-600 font-medium">Reason for Visit:</span>
                      <p className="mt-1 text-gray-700">{receipt.appointment.reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: DOCTOR INFORMATION */}
              <div className="border border-gray-300 rounded-lg p-4 page-break-avoid">
                <h4 className="font-bold text-gray-900 mb-3 text-base border-b pb-2">👨‍⚕️ Doctor Information</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Doctor's Name:</span>
                    <span className="ml-2 font-semibold">{receipt.doctor.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Specialization:</span>
                    <span className="ml-2 font-semibold">{receipt.doctor.specialization}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="ml-2">{receipt.doctor.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Department:</span>
                    <span className="ml-2">{receipt.appointment.department}</span>
                  </div>
                </div>
                {/* Signature Area */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-end items-end">
                    <div className="text-center">
                      <div className="border-t-2 border-gray-400 w-48 mb-1 mt-12"></div>
                      <p className="text-xs text-gray-600">Doctor's Signature</p>
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION 3: DIAGNOSIS & CLINICAL FINDINGS */}
              {receipt.clinical_assessment && (
                <div className="border border-blue-300 rounded-lg p-4 bg-blue-50 page-break-avoid">
                  <h4 className="font-bold text-gray-900 mb-3 text-base border-b border-blue-300 pb-2">🩺 Diagnosis & Clinical Findings</h4>
                  
                  {/* Clinical Notes */}
                  {receipt.clinical_assessment.clinical_notes && (
                    <div className="mb-3">
                      <h5 className="font-semibold text-gray-800 mb-2 text-sm">Clinical Notes:</h5>
                      <div className="bg-white border border-blue-200 rounded p-3 text-sm text-gray-700 clinical-notes-print leading-relaxed">
                        {receipt.clinical_assessment.clinical_notes}
                      </div>
                    </div>
                  )}

                  {/* Diagnosis */}
                  {receipt.clinical_assessment.diagnosis && (
                    <div className="mb-3">
                      <h5 className="font-semibold text-gray-800 mb-2 text-sm">Diagnosis:</h5>
                      <div className="bg-white border border-blue-200 rounded p-3 text-sm text-gray-700 clinical-notes-print leading-relaxed">
                        {receipt.clinical_assessment.diagnosis}
                      </div>
                    </div>
                  )}

                  {/* Medical Observations */}
                  {receipt.clinical_assessment.treatment_plan && (
                    <div className="mb-3">
                      <h5 className="font-semibold text-gray-800 mb-2 text-sm">Medical Observations:</h5>
                      <div className="bg-white border border-blue-200 rounded p-3 text-sm text-gray-700 clinical-notes-print leading-relaxed">
                        {receipt.clinical_assessment.treatment_plan}
                      </div>
                    </div>
                  )}
                  
                  {/* Status */}
                  <div className="flex items-center text-sm mt-3 pt-3 border-t border-blue-300">
                    <span className="font-semibold text-gray-700 mr-2">Admission Required:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      receipt.clinical_assessment.requires_admission 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {receipt.clinical_assessment.requires_admission ? 'YES' : 'NO'}
                    </span>
                    {receipt.clinical_assessment.submitted_at && (
                      <span className="ml-auto text-xs text-gray-600">
                        Completed: {new Date(receipt.clinical_assessment.submitted_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 4: THERAPY / PRESCRIPTION */}
              {receipt.clinical_assessment && (receipt.clinical_assessment.therapy_prescribed || receipt.clinical_assessment.follow_up_instructions) && (
                <div className="border border-green-300 rounded-lg p-4 bg-green-50 page-break-avoid">
                  <h4 className="font-bold text-gray-900 mb-3 text-base border-b border-green-300 pb-2">💊 Therapy / Prescription</h4>
                  
                  {/* Therapy Instructions */}
                  {receipt.clinical_assessment.therapy_prescribed && (
                    <div className="mb-3">
                      <h5 className="font-semibold text-gray-800 mb-2 text-sm">Prescribed Therapy & Medications:</h5>
                      <div className="bg-white border border-green-200 rounded p-3 text-sm text-gray-800 clinical-notes-print font-medium leading-relaxed">
                        {receipt.clinical_assessment.therapy_prescribed}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Instructions */}
                  {receipt.clinical_assessment.follow_up_instructions && (
                    <div className="mb-3">
                      <h5 className="font-semibold text-gray-800 mb-2 text-sm">Follow-up Instructions:</h5>
                      <div className="bg-white border border-green-200 rounded p-3 text-sm text-gray-700 clinical-notes-print leading-relaxed">
                        {receipt.clinical_assessment.follow_up_instructions}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Date */}
                  {receipt.clinical_assessment.follow_up_date && (
                    <div className="mt-3 pt-3 border-t border-green-300 text-sm">
                      <span className="font-semibold text-gray-700">Next Appointment:</span>
                      <span className="ml-2 text-gray-800 font-medium">
                        {new Date(receipt.clinical_assessment.follow_up_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 5: INVOICE / PAYMENT SUMMARY */}
              <div className="border-2 border-gray-400 rounded-lg p-4 bg-gray-50 page-break-avoid">
                <h4 className="font-bold text-gray-900 mb-3 text-base border-b-2 border-gray-400 pb-2">💳 Invoice / Payment Summary</h4>
                
                {/* Service Details Table */}
                <div className="mb-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="text-left p-2 border border-gray-300 font-semibold">Service Name</th>
                        <th className="text-center p-2 border border-gray-300 font-semibold w-20">Qty</th>
                        <th className="text-right p-2 border border-gray-300 font-semibold w-28">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.bill && receipt.bill.items && receipt.bill.items.length > 0 ? (
                        receipt.bill.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-300">
                            <td className="p-2 border border-gray-300">{item.description}</td>
                            <td className="text-center p-2 border border-gray-300">{item.quantity}</td>
                            <td className="text-right p-2 border border-gray-300 font-medium">€{item.amount.toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-2 border border-gray-300">{receipt.appointment.department} - Consultation</td>
                          <td className="text-center p-2 border border-gray-300">1</td>
                          <td className="text-right p-2 border border-gray-300 font-medium">€{receipt.payment.amount.toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-200 font-bold">
                        <td colSpan="2" className="p-2 border border-gray-300 text-right">Total Amount:</td>
                        <td className="text-right p-2 border border-gray-300 text-lg text-green-700">
                          €{(receipt.bill?.total_amount || receipt.payment.amount).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Payment Details */}
                <div className="bg-white border border-gray-300 rounded p-3">
                  <h5 className="font-semibold text-gray-800 mb-2 text-sm">Payment Details:</h5>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">Payment Status:</span>
                      <span className={`ml-2 font-bold ${
                        receipt.payment.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {receipt.payment.payment_status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Payment Method:</span>
                      <span className="ml-2 text-gray-800">{receipt.payment.payment_method}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Payment Date:</span>
                      <span className="ml-2 text-gray-800">{new Date(receipt.payment.paid_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Amount Paid:</span>
                      <span className="ml-2 font-bold text-green-600">€{receipt.payment.amount.toFixed(2)}</span>
                    </div>
                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                      <span className="text-gray-600 font-medium">Transaction Reference:</span>
                      <p className="font-mono text-xs text-gray-700 mt-1 break-all">{receipt.payment.transaction_ref}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-sm text-gray-600 pt-4 border-t-2 border-gray-300 mt-4">
                <p className="font-semibold">Thank you for choosing our services!</p>
                <p className="mt-2 text-xs">This is an official computer-generated receipt and does not require a signature.</p>
                <p className="mt-2 text-xs text-gray-500">For any inquiries, please contact us at {receipt.issuer.email} or {receipt.issuer.phone}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceipt(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentDetails;
