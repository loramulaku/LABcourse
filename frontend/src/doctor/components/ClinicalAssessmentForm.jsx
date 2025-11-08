import React, { useState, useEffect, useCallback } from 'react';
import { API_URL, getAccessToken } from '../../api';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ClinicalAssessmentForm = ({ appointment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    clinical_assessment: '',
    requires_admission: null,
    therapy_prescribed: '',
  });

  const [admissionDetails, setAdmissionDetails] = useState({
    diagnosis: '',
    treatment_plan: '',
    recommended_ward_id: '',
    recommended_room_type: '',
    urgency: 'Normal',
  });

  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

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
        setWards(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    } finally {
      setLoadingWards(false);
    }
  }, []);

  useEffect(() => {
    if (formData.requires_admission === true) {
      fetchWards();
    }
  }, [formData.requires_admission, fetchWards]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.clinical_assessment.trim()) {
      toast.error('Clinical assessment is required');
      return;
    }

    if (formData.requires_admission === null) {
      toast.error('Please select if patient requires admission');
      return;
    }

    if (formData.requires_admission === false && !formData.therapy_prescribed.trim()) {
      toast.error('Therapy prescription is required when admission is not needed');
      return;
    }

    if (formData.requires_admission === true) {
      if (!admissionDetails.diagnosis.trim()) {
        toast.error('Diagnosis is required for admission');
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        requires_admission: formData.requires_admission,
        therapy_prescribed: formData.requires_admission ? null : formData.therapy_prescribed,
        clinical_assessment: formData.clinical_assessment,
        admission_details: formData.requires_admission ? admissionDetails : null,
      };

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
        toast.error(error.error || 'Failed to submit assessment');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Error submitting assessment');
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

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Clinical Assessment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Assessment <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.clinical_assessment}
              onChange={(e) => setFormData({ ...formData, clinical_assessment: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your clinical assessment, observations, and diagnosis..."
              required
              disabled={loading}
            />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter proposed treatment plan for inpatient care..."
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommended Ward
                  </label>
                  {loadingWards ? (
                    <div className="text-sm text-gray-500">Loading wards...</div>
                  ) : (
                    <select
                      value={admissionDetails.recommended_ward_id}
                      onChange={(e) =>
                        setAdmissionDetails({
                          ...admissionDetails,
                          recommended_ward_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="">Select Ward (Optional)</option>
                      {wards.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommended Room Type
                  </label>
                  <select
                    value={admissionDetails.recommended_room_type}
                    onChange={(e) =>
                      setAdmissionDetails({
                        ...admissionDetails,
                        recommended_room_type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">Select Room Type (Optional)</option>
                    {roomTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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
              disabled={loading || formData.requires_admission === null}
            >
              {loading ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClinicalAssessmentForm;
