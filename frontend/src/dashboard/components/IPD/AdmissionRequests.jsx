import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../api';
import { CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdmissionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [approvalData, setApprovalData] = useState({ ward_id: '', room_id: '', bed_id: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchWards();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ipd/admin/admission-requests?status=Pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Error fetching admission requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchWards = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/wards`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWards(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  const fetchRooms = async (wardId) => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/rooms?wardId=${wardId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchBeds = async (roomId) => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/beds?roomId=${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setBeds(data.data.filter(bed => bed.status === 'Available') || []);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/admission-requests/${selectedRequest.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify(approvalData),
      });

      if (response.ok) {
        toast.success('Admission request approved');
        setShowApprovalModal(false);
        fetchRequests();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Error approving request');
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/admission-requests/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      if (response.ok) {
        toast.success('Admission request rejected');
        setShowRejectModal(false);
        fetchRequests();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error rejecting request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const requestsList = Array.isArray(requests) ? requests : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Pending Admission Requests
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Review and process admission requests</p>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending requests: {requestsList.length}</p>

      <div className="space-y-6">
        {requestsList.map((request) => (
          <div key={request.id} className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {request.patient?.name}
                  </h3>
                  {request.urgency === 'Emergency' && (
                    <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                      <AlertCircle className="w-4 h-4" />
                      EMERGENCY
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Requested by:</span> Dr. {request.doctor?.first_name} {request.doctor?.last_name}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(request.requested_date).toLocaleString()}
                  </div>
                  {request.recommended_ward && (
                    <div>
                      <span className="font-medium">Recommended Ward:</span> {request.recommended_ward?.name}
                    </div>
                  )}
                  {request.recommended_room_type && (
                    <div>
                      <span className="font-medium">Room Type:</span> {request.recommended_room_type}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="font-medium text-sm text-gray-700 mb-1">Diagnosis:</div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{request.diagnosis}</p>
                </div>

                {request.treatment_plan && (
                  <div className="mb-4">
                    <div className="font-medium text-sm text-gray-700 mb-1">Treatment Plan:</div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{request.treatment_plan}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setApprovalData({ ward_id: request.recommended_ward_id || '', room_id: '', bed_id: '' });
                    if (request.recommended_ward_id) {
                      fetchRooms(request.recommended_ward_id);
                    }
                    setShowApprovalModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium whitespace-nowrap"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setRejectionReason('');
                    setShowRejectModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium whitespace-nowrap"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {requestsList.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl p-8">
            <p className="text-gray-500 dark:text-gray-400">No pending admission requests</p>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Approve Admission & Assign Bed</h3>
              <button onClick={() => setShowApprovalModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleApprove}>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Patient: {selectedRequest.patient?.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Diagnosis: {selectedRequest.diagnosis}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Ward *</label>
                  <select
                    value={approvalData.ward_id}
                    onChange={(e) => {
                      setApprovalData({ ...approvalData, ward_id: e.target.value, room_id: '', bed_id: '' });
                      fetchRooms(e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900"
                    required
                  >
                    <option value="">Select Ward</option>
                    {wards.map((ward) => (
                      <option key={ward.id} value={ward.id}>{ward.name}</option>
                    ))}
                  </select>
                </div>
                {approvalData.ward_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Room *</label>
                    <select
                      value={approvalData.room_id}
                      onChange={(e) => {
                        setApprovalData({ ...approvalData, room_id: e.target.value, bed_id: '' });
                        fetchBeds(e.target.value);
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900"
                      required
                    >
                      <option value="">Select Room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>Room {room.room_number} ({room.room_type})</option>
                      ))}
                    </select>
                  </div>
                )}
                {approvalData.room_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Available Bed *</label>
                    <select
                      value={approvalData.bed_id}
                      onChange={(e) => setApprovalData({ ...approvalData, bed_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900"
                      required
                    >
                      <option value="">Select Bed</option>
                      {beds.map((bed) => (
                        <option key={bed.id} value={bed.id}>Bed {bed.bed_number}</option>
                      ))}
                    </select>
                    {beds.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">No available beds in this room</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Approve & Admit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Reject Admission Request</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Patient: {selectedRequest.patient?.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900"
                  rows={4}
                  placeholder="Enter reason for rejection..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
