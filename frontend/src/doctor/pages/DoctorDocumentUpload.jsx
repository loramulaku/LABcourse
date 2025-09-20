import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL, getAccessToken } from "../../api";
import { toast } from "react-toastify";
import PageMeta from "../../dashboard/components/common/PageMeta";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";

const DoctorDocumentUpload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patient");
  
  const [patients, setPatients] = useState([]);
  const [uploadForm, setUploadForm] = useState({
    patient_id: patientId || "",
    title: "",
    description: "",
    document_type: "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setPatientsLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        toast.error("Failed to load patients");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Error loading patients");
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("File type not supported. Please upload PDF, images, or documents.");
        return;
      }

      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.patient_id) {
      toast.error("Please select a patient");
      return;
    }

    if (!uploadForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!uploadForm.file) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('patient_id', uploadForm.patient_id);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('document_type', uploadForm.document_type);
      formData.append('file', uploadForm.file);

      const response = await fetch(`${API_URL}/api/doctor/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Document uploaded successfully");
        // Reset form
        setUploadForm({
          patient_id: "",
          title: "",
          description: "",
          document_type: "",
          file: null,
        });
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        navigate("/doctor/documents/files");
      } else {
        toast.error("Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error uploading document");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <PageMeta title="Upload Document" description="Upload patient documents" />
      <PageBreadcrumb pageTitle="Upload Document" />

      <div className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Document</h1>
              <p className="text-gray-600">Upload patient-related files and documents</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/doctor/documents/files")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Files
              </button>
            </div>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient *
                </label>
                {patientsLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    Loading patients...
                  </div>
                ) : (
                  <select
                    value={uploadForm.patient_id}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, patient_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Lab Report - Blood Test"
                  required
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  value={uploadForm.document_type}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, document_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select document type...</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="x_ray">X-Ray</option>
                  <option value="scan">Scan (CT/MRI)</option>
                  <option value="prescription">Prescription</option>
                  <option value="medical_certificate">Medical Certificate</option>
                  <option value="insurance">Insurance Document</option>
                  <option value="referral">Referral Letter</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a brief description of the document..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-input"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-input"
                          name="file-input"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>

                {/* File Preview */}
                {uploadForm.file && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="h-8 w-8 text-blue-500 mr-3"
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
                        <div>
                          <p className="text-sm font-medium text-gray-900">{uploadForm.file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(uploadForm.file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Uploading..." : "Upload Document"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/doctor/documents/files")}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Upload Guidelines */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Upload Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Maximum file size: 10MB</li>
              <li>• Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, GIF</li>
              <li>• Ensure patient privacy and data security</li>
              <li>• Use descriptive titles for easy identification</li>
              <li>• Documents are automatically linked to patient records</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorDocumentUpload;
