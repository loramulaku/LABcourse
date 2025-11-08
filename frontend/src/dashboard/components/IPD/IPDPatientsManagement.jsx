import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../api';
import { Eye, MapPin, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function IPDPatientsManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [transferData, setTransferData] = useState({ ward_id: '', room_id: '', bed_id: '' });

  useEffect(() => {
    fetchPatients();
    fetchWards();
  }, [statusFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `${API_URL}/api/ipd/admin/patients?status=${statusFilter}`
        : `${API_URL}/api/ipd/admin/patients`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching IPD patients:', error);
      toast.error('Error fetching patients');
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

  const handleApproveDischarge = async (patientId) => {
    if (!window.confirm('Are you sure you want to discharge this patient?')) return;

    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/discharges/${patientId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Patient discharged successfully');
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to discharge patient');
      }
    } catch (error) {
      console.error('Error discharging patient:', error);
      toast.error('Error discharging patient');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/transfers/${selectedPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify(transferData),
      });

      if (response.ok) {
        toast.success('Patient transferred successfully');
        setShowTransferModal(false);
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to transfer patient');
      }
    } catch (error) {
      console.error('Error transferring patient:', error);
      toast.error('Error transferring patient');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Admitted: 'bg-blue-100 text-blue-800',
      UnderCare: 'bg-green-100 text-green-800',
      TransferRequested: 'bg-yellow-100 text-yellow-800',
      DischargeRequested: 'bg-purple-100 text-purple-800',
      Discharged: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const patientsList = Array.isArray(patients) ? patients : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            IPD Patients
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Manage all admitted patients</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="Admitted">Admitted</option>
          <option value="UnderCare">Under Care</option>
          <option value="TransferRequested">Transfer Requested</option>
          <option value="DischargeRequested">Discharge Requested</option>
          <option value="Discharged">Discharged</option>
        </select>
      </div>

      <div className="overflow-x-auto bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patientsList.map((patient) => (
              <tr key={patient.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {patient.patient?.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{patient.patient?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Dr. {patient.doctor?.first_name} {patient.doctor?.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{patient.ward?.name}</div>
                  <div className="text-xs text-gray-500">
                    Room {patient.room?.room_number}, Bed {patient.bed?.bed_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(patient.admission_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setSelectedPatient(patient)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {patient.status !== 'Discharged' && (
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setTransferData({ ward_id: '', room_id: '', bed_id: '' });
                        setShowTransferModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                  )}
                  {patient.status === 'DischargeRequested' && (
                    <button
                      onClick={() => handleApproveDischarge(patient.id)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Discharge
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {patientsList.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl p-8">
            <p className="text-gray-500 dark:text-gray-400">No patients found.</p>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Transfer Patient</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Current Location</label>
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    {selectedPatient.ward?.name} - Room {selectedPatient.room?.room_number} - Bed {selectedPatient.bed?.bed_number}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">New Ward *</label>
                  <select
                    value={transferData.ward_id}
                    onChange={(e) => {
                      setTransferData({ ...transferData, ward_id: e.target.value, room_id: '', bed_id: '' });
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
                {transferData.ward_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">New Room *</label>
                    <select
                      value={transferData.room_id}
                      onChange={(e) => {
                        setTransferData({ ...transferData, room_id: e.target.value, bed_id: '' });
                        fetchBeds(e.target.value);
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900"
                      required
                    >
                      <option value="">Select Room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>Room {room.room_number}</option>
                      ))}
                    </select>
                  </div>
                )}
                {transferData.room_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">New Bed *</label>
                    <select
                      value={transferData.bed_id}
                      onChange={(e) => setTransferData({ ...transferData, bed_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900"
                      required
                    >
                      <option value="">Select Bed</option>
                      {beds.map((bed) => (
                        <option key={bed.id} value={bed.id}>Bed {bed.bed_number}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
