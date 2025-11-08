import React, { useState, useEffect } from 'react';
import { API_URL } from '../../api';
import { Eye, FileText, Activity, LogOut, X, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

export default function MyIPDPatients() {
  const [patients, setPatients] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [suggestedWard, setSuggestedWard] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchWards();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ipd/doctor/my-patients`, {
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
      const response = await fetch(`${API_URL}/api/ipd/doctor/wards`, {
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

  const fetchPatientDetails = async (patientId) => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/doctor/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPatient(data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast.error('Error fetching patient details');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/ipd/doctor/notes/${selectedPatient.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ note: noteText }),
      });

      if (response.ok) {
        toast.success('Note added successfully');
        setNoteText('');
        setShowNoteModal(false);
        fetchPatientDetails(selectedPatient.id);
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error adding note');
    }
  };

  const handleUpdateTreatment = async () => {
    if (!treatmentPlan.trim()) {
      toast.error('Please enter treatment plan');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/ipd/doctor/patients/${selectedPatient.id}/treatment-plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ treatment_plan: treatmentPlan }),
      });

      if (response.ok) {
        toast.success('Treatment plan updated successfully');
        setShowTreatmentModal(false);
        fetchPatientDetails(selectedPatient.id);
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update treatment plan');
      }
    } catch (error) {
      console.error('Error updating treatment plan:', error);
      toast.error('Error updating treatment plan');
    }
  };

  const handleRequestTransfer = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/doctor/patients/${selectedPatient.id}/request-transfer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ reason: transferReason, suggested_ward_id: suggestedWard }),
      });

      if (response.ok) {
        toast.success('Transfer request submitted');
        setShowTransferModal(false);
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to request transfer');
      }
    } catch (error) {
      console.error('Error requesting transfer:', error);
      toast.error('Error requesting transfer');
    }
  };

  const handleRequestDischarge = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/doctor/patients/${selectedPatient.id}/request-discharge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ discharge_summary: dischargeSummary }),
      });

      if (response.ok) {
        toast.success('Discharge request submitted');
        setShowDischargeModal(false);
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to request discharge');
      }
    } catch (error) {
      console.error('Error requesting discharge:', error);
      toast.error('Error requesting discharge');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Admitted: 'bg-blue-100 text-blue-800',
      UnderCare: 'bg-green-100 text-green-800',
      TransferRequested: 'bg-yellow-100 text-yellow-800',
      DischargeRequested: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading your IPD patients...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My IPD Patients</h1>
        <p className="mt-2 text-sm text-gray-600">Manage your inpatient department patients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <div key={patient.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {patient.patient?.first_name} {patient.patient?.last_name}
                </h3>
                <p className="text-sm text-gray-500">{patient.patient?.phone}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                {patient.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div>
                <span className="font-medium">Location:</span> {patient.ward?.name}
              </div>
              <div className="text-xs text-gray-500">
                Room {patient.room?.room_number}, Bed {patient.bed?.bed_number}
              </div>
              <div>
                <span className="font-medium">Admitted:</span>{' '}
                {new Date(patient.admission_date).toLocaleDateString()}
              </div>
              {patient.urgency === 'Emergency' && (
                <div className="text-red-600 font-semibold">⚠️ Emergency</div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded mb-4">
              <div className="text-xs font-medium text-gray-700 mb-1">Diagnosis:</div>
              <div className="text-sm text-gray-600 line-clamp-2">{patient.primary_diagnosis}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fetchPatientDetails(patient.id)}
                className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </button>
              <button
                onClick={() => {
                  setSelectedPatient(patient);
                  setNoteText('');
                  setShowNoteModal(true);
                }}
                className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                <FileText className="w-4 h-4 mr-1" />
                Note
              </button>
              <button
                onClick={() => {
                  setSelectedPatient(patient);
                  setTreatmentPlan(patient.treatment_plan || '');
                  setShowTreatmentModal(true);
                }}
                className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                <Activity className="w-4 h-4 mr-1" />
                Treatment
              </button>
              {patient.status !== 'TransferRequested' && patient.status !== 'DischargeRequested' && (
                <button
                  onClick={() => {
                    setSelectedPatient(patient);
                    setTransferReason('');
                    setSuggestedWard('');
                    setShowTransferModal(true);
                  }}
                  className="flex items-center justify-center px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Transfer
                </button>
              )}
              {patient.status !== 'DischargeRequested' && (
                <button
                  onClick={() => {
                    setSelectedPatient(patient);
                    setDischargeSummary('');
                    setShowDischargeModal(true);
                  }}
                  className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm col-span-2"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Request Discharge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {patients.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          You have no IPD patients at the moment
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Patient Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Patient Name</div>
                  <div className="text-base text-gray-900">
                    {selectedPatient.patient?.first_name} {selectedPatient.patient?.last_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Location</div>
                  <div className="text-base text-gray-900">
                    {selectedPatient.ward?.name} - Room {selectedPatient.room?.room_number} - Bed{' '}
                    {selectedPatient.bed?.bed_number}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Admission Date</div>
                  <div className="text-base text-gray-900">
                    {new Date(selectedPatient.admission_date).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Status</div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPatient.status)}`}>
                    {selectedPatient.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Primary Diagnosis</div>
                <div className="text-base text-gray-900 bg-gray-50 p-3 rounded">
                  {selectedPatient.primary_diagnosis}
                </div>
              </div>

              {selectedPatient.treatment_plan && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Treatment Plan</div>
                  <div className="text-base text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedPatient.treatment_plan}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Daily Notes</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedPatient.daily_notes?.length > 0 ? (
                    selectedPatient.daily_notes.map((note) => (
                      <div key={note.id} className="bg-blue-50 p-3 rounded">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>
                            Dr. {note.doctor?.first_name} {note.doctor?.last_name}
                          </span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-gray-900">{note.note}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">No notes yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Daily Note</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded text-sm">
                Patient: {selectedPatient.patient?.first_name} {selectedPatient.patient?.last_name}
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={6}
                placeholder="Enter clinical notes, observations, medication changes, etc..."
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={handleAddNote} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Treatment Modal */}
      {showTreatmentModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Update Treatment Plan</h3>
              <button onClick={() => setShowTreatmentModal(false)} className="text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded text-sm">
                Patient: {selectedPatient.patient?.first_name} {selectedPatient.patient?.last_name}
              </div>
              <textarea
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={6}
                placeholder="Enter treatment plan details..."
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTreatmentModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={handleUpdateTreatment} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Update Treatment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Request Modal */}
      {showTransferModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Request Patient Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-3 rounded text-sm">
                Patient: {selectedPatient.patient?.first_name} {selectedPatient.patient?.last_name}
                <br />
                Current Location: {selectedPatient.ward?.name} - Room {selectedPatient.room?.room_number}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Suggested Ward</label>
                <select
                  value={suggestedWard}
                  onChange={(e) => setSuggestedWard(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Ward (Optional)</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Transfer</label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Enter reason for transfer..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={handleRequestTransfer} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                Request Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discharge Request Modal */}
      {showDischargeModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Request Patient Discharge</h3>
              <button onClick={() => setShowDischargeModal(false)} className="text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 p-3 rounded text-sm">
                Patient: {selectedPatient.patient?.first_name} {selectedPatient.patient?.last_name}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discharge Summary</label>
                <textarea
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={6}
                  placeholder="Enter discharge summary and recommendations..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDischargeModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={handleRequestDischarge} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Request Discharge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
