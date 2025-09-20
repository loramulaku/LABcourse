import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import apiFetch from "../../../api";
import { useOutletContext, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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

// Outlet context for searchQuery
// interface ContextType {
//   searchQuery: string;
// }

export default function DoctorApplications() {
  const { searchQuery } = useOutletContext();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("http://localhost:5000/api/doctor-applications/all");
      setApplications(data);
    } catch (err) {
      console.error("Error loading applications:", err);
      toast.error("Failed to load doctor applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: number) => {
    try {
      setActionLoading(applicationId);
      await apiFetch(`http://localhost:5000/api/doctor-applications/approve/${applicationId}`, {
        method: "POST",
      });
      toast.success("Doctor application approved successfully!");
      loadApplications();
    } catch (err) {
      console.error("Error approving application:", err);
      toast.error("Failed to approve application");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setActionLoading(applicationId);
      await apiFetch(`http://localhost:5000/api/doctor-applications/reject/${applicationId}`, {
        method: "POST",
        body: JSON.stringify({ rejectionReason }),
      });
      toast.success("Doctor application rejected");
      setShowRejectModal(null);
      setRejectionReason("");
      loadApplications();
    } catch (err) {
      console.error("Error rejecting application:", err);
      toast.error("Failed to reject application");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter applications based on search query
  const filteredApplications = applications.filter((app) =>
    [app.name, app.email, app.medical_field, app.specialization, app.status]
      .filter(Boolean)
      .some((field) =>
        String(field).toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  if (loading) return <p className="p-4">Duke u ngarkuar...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Doctor Applications</h2>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white m-4">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Doctor
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">
                  License
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Medical Field
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Experience
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Applied
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100">
              {filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="px-4 py-3">
                    <div>
                      <button
                        onClick={() => navigate(`/dashboard/doctor-applications/${app.id}`)}
                        className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {app.name}
                      </button>
                      <div className="text-sm text-gray-500">
                        {app.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {app.license_number}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div>
                      <div className="font-medium">{app.medical_field}</div>
                      {app.specialization && (
                        <div className="text-sm text-gray-500">
                          {app.specialization}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="text-sm">
                      {app.experience_years} years
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      size="sm"
                      color={
                        app.status === "approved"
                          ? "success"
                          : app.status === "pending"
                            ? "warning"
                            : "error"
                      }
                    >
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {app.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={actionLoading === app.id}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-1"
                          >
                            {actionLoading === app.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => setShowRejectModal(app.id)}
                            disabled={actionLoading === app.id}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </>
                      )}
                      {app.status === "rejected" && app.rejection_reason && (
                        <div className="text-xs text-red-600 max-w-xs">
                          Reason: {app.rejection_reason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                  setShowRejectModal(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={actionLoading === showRejectModal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md transition-colors duration-200 flex items-center gap-2"
              >
                {actionLoading === showRejectModal && (
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
