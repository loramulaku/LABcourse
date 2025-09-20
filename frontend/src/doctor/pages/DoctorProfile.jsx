import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, getAccessToken } from "../../api";
import { toast } from "react-toastify";
import PageMeta from "../../dashboard/components/common/PageMeta";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";

const DoctorProfile = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/profile`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDoctor(data);
      } else {
        toast.error("Failed to load doctor profile");
      }
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
      toast.error("Error loading doctor profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Doctor Profile" description="Doctor profile information" />
      <PageBreadcrumb pageTitle="Profile" />

      <div className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Profile</h1>
              <p className="text-gray-600">Manage your profile information</p>
            </div>
            <button
              onClick={() => navigate("/doctor/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="h-24 w-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {doctor?.name?.charAt(0)?.toUpperCase() || "D"}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{doctor?.name || "Doctor Name"}</h2>
                <p className="text-gray-600">{doctor?.email || "doctor@example.com"}</p>
                <p className="text-sm text-gray-500">{doctor?.speciality || "General Practice"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{doctor?.email || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Speciality</label>
                  <p className="text-gray-900">{doctor?.speciality || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <p className="text-gray-900">{doctor?.experience || "N/A"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{doctor?.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fees</label>
                  <p className="text-gray-900">{doctor?.fees ? `€${doctor.fees}` : "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorProfile;
