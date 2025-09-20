import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiFetch from "../../../api";
import { toast } from "react-toastify";
import Badge from "../components/ui/badge/Badge";

// Doctor Application Interface
// interface DoctorApplication {
//   id: number;
//   user_id: number;
//   name: string;
//   email: string;
//   license_number: string;
//   medical_field: string;
//   specialization: string;
//   experience_years: number;
//   education: string;
//   previous_clinic: string;
//   phone: string;
//   bio: string;
//   status: "pending" | "approved" | "rejected";
//   rejection_reason?: string;
//   created_at: string;
//   reviewed_by_name?: string;
//   reviewed_at?: string;
// }

export default function DoctorApplicationDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`http://localhost:5000/api/doctor-applications/all`);
      const app = data.find((a) => a.id === parseInt(applicationId));
      if (app) {
        setApplication(app);
      } else {
        toast.error("Application not found");
        navigate("/dashboard/doctor-applications");
      }
    } catch (err) {
      console.error("Error loading application:", err);
      toast.error("Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await apiFetch(`http://localhost:5000/api/doctor-applications/approve/${applicationId}`, {
        method: "POST",
      });
      toast.success("Doctor application approved successfully!");
      navigate("/dashboard/doctor-applications");
    } catch (err) {
      console.error("Error approving application:", err);
      toast.error("Failed to approve application");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setActionLoading(true);
      await apiFetch(`http://localhost:5000/api/doctor-applications/reject/${applicationId}`, {
        method: "POST",
        body: JSON.stringify({ rejectionReason }),
      });
      toast.success("Doctor application rejected");
      navigate("/dashboard/doctor-applications");
    } catch (err) {
      console.error("Error rejecting application:", err);
      toast.error("Failed to reject application");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="p-4">Duke u ngarkuar...</p>;

  if (!application) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h2>
          <button
            onClick={() => navigate("/dashboard/doctor-applications")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate("/dashboard/doctor-applications")}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-semibold">Doctor Application Details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-gray-900">{application.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{application.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-900">{application.phone || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Applied On</label>
                <p className="text-gray-900">
                  {new Date(application.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Professional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">License Number</label>
                <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                  {application.license_number}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Medical Field</label>
                <p className="text-gray-900">{application.medical_field}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Specialization</label>
                <p className="text-gray-900">{application.specialization || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Years of Experience</label>
                <p className="text-gray-900">{application.experience_years} years</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Previous Clinic</label>
                <p className="text-gray-900">{application.previous_clinic || "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* Education */}
          {application.education && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Education Background
              </h2>
              <p className="text-gray-900 whitespace-pre-wrap">
                {application.education}
              </p>
            </div>
          )}

          {/* Bio */}
          {application.bio && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Professional Bio
              </h2>
              <p className="text-gray-900 whitespace-pre-wrap">
                {application.bio}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Application Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge
                  size="sm"
                  color={
                    application.status === "approved"
                      ? "success"
                      : application.status === "pending"
                        ? "warning"
                        : "error"
                  }
                >
                  {application.status}
                </Badge>
              </div>
              {application.reviewed_by_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reviewed by</span>
                  <span className="text-sm text-gray-900">{application.reviewed_by_name}</span>
                </div>
              )}
              {application.reviewed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reviewed on</span>
                  <span className="text-sm text-gray-900">
                    {new Date(application.reviewed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {application.rejection_reason && (
                <div>
                  <span className="text-sm text-gray-600">Rejection Reason</span>
                  <p className="text-sm text-red-600 mt-1">
                    {application.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {application.status === "pending" && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Approve Application
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reject Doctor Application
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Please provide a reason for rejecting this application:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={4}
          />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md transition-colors duration-200 flex items-center gap-2"
              >
                {actionLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
