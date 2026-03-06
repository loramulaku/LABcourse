import React, { useState, useEffect, useCallback } from 'react';
import { API_URL, getAccessToken } from '../../api';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ClinicalAssessmentForm = ({ appointment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    clinical_notes: '',
    diagnosis: '',
    requires_admission: null,
    therapy_prescribed: '',
    treatment_plan: '',
    follow_up_instructions: '',
  });

  const [admissionDetails, setAdmissionDetails] = useState({
    diagnosis: '',
    treatment_plan: '',
    recommended_ward_id: '',
    recommended_room_id: '',
    recommended_bed_id: '',
    recommended_room_type: '',
    urgency: 'Normal',
  });

  const [isLocked, setIsLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);

  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);

  const roomTypes = ['Single', 'Double', 'ICU', 'Maternity', 'Pediatric', 'Emergency', 'General'];

  const fetchWards = useCallback(async () => {
    try {
      setLoadingWards(true);
      const response = await fetch(`${API_URL}/api/ipd/doctor/wards`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Response structure: { success: true, data: { data: wards[], count: n } }
        const wardsArray = data.data?.data || data.data || [];
        setWards(Array.isArray(wardsArray) ? wardsArray : []);
      } else {
        console.error('Failed to fetch wards:', response.status);
        setWards([]);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    } finally {
      setLoadingWards(false);
    }
  }, []);

  const fetchRooms = useCallback(async (wardId) => {
    if (!wardId) { setRooms([]); setBeds([]); return; }
    try {
      setLoadingRooms(true);
      const response = await fetch(`${API_URL}/api/ipd/doctor/rooms?wardId=${wardId}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const roomsArray = data.data?.data || data.data || [];
        setRooms(Array.isArray(roomsArray) ? roomsArray : []);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const fetchBeds = useCallback(async (roomId) => {
    if (!roomId) { setBeds([]); return; }
    try {
      setLoadingBeds(true);
      const response = await fetch(`${API_URL}/api/ipd/doctor/beds?roomId=${roomId}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const bedsArray = data.data?.data || data.data || [];
        setBeds(Array.isArray(bedsArray) ? bedsArray : []);
      } else {
        setBeds([]);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
    } finally {
      setLoadingBeds(false);
    }
  }, []);

  // Check if assessment is locked
  const checkLockStatus = useCallback(async () => {
    try {
      setCheckingLock(true);
      const response = await fetch(
        `${API_URL}/api/ipd/doctor/assessment/${appointment.id}/status`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setIsLocked(data.isLocked || false);
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
    } finally {
      setCheckingLock(false);
    }
  }, [appointment.id]);

  useEffect(() => {
    checkLockStatus();
  }, [checkLockStatus]);

  useEffect(() => {
    if (formData.requires_admission === true) {
      fetchWards();
    }
  }, [formData.requires_admission, fetchWards]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.clinical_notes || !formData.clinical_notes.trim()) {
      toast.error('Clinical notes are required');
      return;
    }

    if (formData.requires_admission === null || formData.requires_admission === undefined) {
      toast.error('Please select admission decision (Yes or No)');
      return;
    }

    if (formData.requires_admission === false && !formData.therapy_prescribed) {
      toast.error('Therapy prescription is required when admission is not needed');
      return;
    }

    if (formData.requires_admission === true && !formData.diagnosis && !admissionDetails.diagnosis) {
      toast.error('Diagnosis is required for admission');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        clinical_notes: formData.clinical_notes.trim(),
        diagnosis: formData.requires_admission ? (formData.diagnosis || admissionDetails.diagnosis) : null,
        requires_admission: Boolean(formData.requires_admission), // Ensure boolean
        therapy_prescribed: formData.requires_admission ? null : (formData.therapy_prescribed || null),
        treatment_plan: formData.treatment_plan ? formData.treatment_plan.trim() : null,
        follow_up_instructions: formData.follow_up_instructions ? formData.follow_up_instructions.trim() : null,
        admission_details: formData.requires_admission ? {
          ...admissionDetails,
          diagnosis: formData.diagnosis || admissionDetails.diagnosis,
          treatment_plan: formData.treatment_plan || admissionDetails.treatment_plan,
        } : null,
      };

      console.log('📤 Submitting assessment payload:', payload);

      const response = await fetch(
        `${API_URL}/api/doctor/appointment/${appointment.id}/clinical-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAccessToken()}`,
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Assessment submitted successfully');
        onSuccess?.();
        onClose();
      } else {
        const error = await response.json();
        console.error('Submission error:', error);
        
        // Handle validation errors with specific messages
        if (response.status === 422 || response.status === 400) {
          const errorMessage = error.error?.message || error.message || error.error || 'Validation failed';
          toast.error(errorMessage, {
            autoClose: 5000,
            position: 'top-center'
          });
        } else {
          toast.error(error.error?.message || error.message || error.error || 'Failed to submit assessment');
        }
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Network error - please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-3xl my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Clinical Assessment</h2>
              <p className="text-sm text-gray-600 mt-1">
                Appointment with {appointment.patient_name} on{' '}
                {new Date(appointment.scheduled_for).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Locked State Banner */}
        {isLocked && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 px-6 py-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Assessment Locked
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This assessment has been submitted and locked. It cannot be edited.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {checkingLock && (
          <div className="px-6 py-4 text-center text-gray-600">
            <p>Checking assessment status...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Required Fields Notice */}
          <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Required fields:</span> Clinical Notes, Admission Decision, and Therapy (if no admission) or Diagnosis (if admission required)
            </p>
          </div>

          {/* Clinical Notes */}
          <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
            <label className="block text-base font-semibold text-gray-900 mb-2">
              📝 Clinical Notes <span className="text-red-600">* REQUIRED</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Document your clinical findings, observations, and assessment
            </p>
            <textarea
              value={formData.clinical_notes}
              onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
              rows={5}
              disabled={isLocked || checkingLock || loading}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              placeholder="Example: Patient presents with chief complaint of... Physical examination reveals... Assessment shows..."
              required
            />
            {!formData.clinical_notes && (
              <p className="text-xs text-red-600 mt-2 font-medium">⚠️ This field is required before submission</p>
            )}
          </div>

          {/* Admission Decision */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Does the patient require admission? <span className="text-red-600">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 bg-white border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input
                  type="radio"
                  name="requires_admission"
                  checked={formData.requires_admission === false}
                  onChange={() => setFormData({ ...formData, requires_admission: false })}
                  className="w-5 h-5 text-blue-600"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">⛔ Patient does NOT require admission</div>
                  <div className="text-sm text-gray-600">Prescribe therapy only</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-white border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition">
                <input
                  type="radio"
                  name="requires_admission"
                  checked={formData.requires_admission === true}
                  onChange={() => setFormData({ ...formData, requires_admission: true })}
                  className="w-5 h-5 text-green-600"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">✅ Patient requires admission</div>
                  <div className="text-sm text-gray-600">Create IPD admission request</div>
                </div>
              </label>
            </div>
          </div>

          {/* Therapy Only Section */}
          {formData.requires_admission === false && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2 text-blue-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Outpatient Therapy</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Therapy Prescription <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.therapy_prescribed}
                  onChange={(e) => setFormData({ ...formData, therapy_prescribed: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter detailed therapy prescription:&#10;- Medications (name, dosage, frequency)&#10;- Treatment procedures&#10;- Follow-up instructions&#10;- Precautions and recommendations"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Admission Details Section */}
          {formData.requires_admission === true && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2 text-green-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Inpatient Admission Request</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Diagnosis <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={admissionDetails.diagnosis}
                  onChange={(e) =>
                    setAdmissionDetails({ ...admissionDetails, diagnosis: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter primary diagnosis for admission..."
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Plan
                </label>
                <textarea
                  value={admissionDetails.treatment_plan}
                  onChange={(e) =>
                    setAdmissionDetails({ ...admissionDetails, treatment_plan: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter proposed treatment plan for inpatient care..."
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommended Ward
                  </label>
                  {loadingWards ? (
                    <div className="text-sm text-gray-500">Loading wards...</div>
                  ) : (
                    <select
                      value={admissionDetails.recommended_ward_id}
                      onChange={(e) => {
                        const wardId = e.target.value;
                        setAdmissionDetails({
                          ...admissionDetails,
                          recommended_ward_id: wardId,
                          recommended_room_id: '',
                          recommended_bed_id: '',
                        });
                        setRooms([]);
                        setBeds([]);
                        fetchRooms(wardId);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="">Select Ward</option>
                      {Array.isArray(wards) && wards.length > 0 ? (
                        wards.map((ward) => (
                          <option key={ward.id} value={ward.id}>
                            {ward.name || `Ward ${ward.id}`}
                          </option>
                        ))
                      ) : (
                        <option disabled>No wards available</option>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room
                  </label>
                  {loadingRooms ? (
                    <div className="text-sm text-gray-500">Loading rooms...</div>
                  ) : (
                    <select
                      value={admissionDetails.recommended_room_id}
                      onChange={(e) => {
                        const roomId = e.target.value;
                        setAdmissionDetails({
                          ...admissionDetails,
                          recommended_room_id: roomId,
                          recommended_bed_id: '',
                        });
                        setBeds([]);
                        fetchBeds(roomId);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={loading || !admissionDetails.recommended_ward_id}
                    >
                      <option value="">Select Room</option>
                      {Array.isArray(rooms) && rooms.length > 0 ? (
                        rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.room_number || `Room ${room.id}`} ({room.room_type || 'General'})
                          </option>
                        ))
                      ) : (
                        <option disabled>{admissionDetails.recommended_ward_id ? 'No rooms in this ward' : 'Select a ward first'}</option>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bed
                  </label>
                  {loadingBeds ? (
                    <div className="text-sm text-gray-500">Loading beds...</div>
                  ) : (
                    <select
                      value={admissionDetails.recommended_bed_id}
                      onChange={(e) =>
                        setAdmissionDetails({
                          ...admissionDetails,
                          recommended_bed_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={loading || !admissionDetails.recommended_room_id}
                    >
                      <option value="">Select Bed</option>
                      {Array.isArray(beds) && beds.length > 0 ? (
                        beds.map((bed) => (
                          <option key={bed.id} value={bed.id}>
                            Bed {bed.bed_number || bed.id} ({bed.bed_type || 'Standard'})
                          </option>
                        ))
                      ) : (
                        <option disabled>{admissionDetails.recommended_room_id ? 'No available beds' : 'Select a room first'}</option>
                      )}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level <span className="text-red-600">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="urgency"
                      value="Normal"
                      checked={admissionDetails.urgency === 'Normal'}
                      onChange={(e) =>
                        setAdmissionDetails({ ...admissionDetails, urgency: e.target.value })
                      }
                      className="w-4 h-4 text-green-600"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Normal</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="urgency"
                      value="Emergency"
                      checked={admissionDetails.urgency === 'Emergency'}
                      onChange={(e) =>
                        setAdmissionDetails({ ...admissionDetails, urgency: e.target.value })
                      }
                      className="w-4 h-4 text-red-600"
                      disabled={loading}
                    />
                    <span className="text-sm font-semibold text-red-700">Emergency</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || formData.requires_admission === null || isLocked || checkingLock}
            >
              {loading ? 'Submitting...' : isLocked ? 'Assessment Locked' : 'Submit Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClinicalAssessmentForm;
