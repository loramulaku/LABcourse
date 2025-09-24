import React, { useState, useEffect } from "react";
import apiFetch, { API_URL } from "../../api";

export default function DoctorProfileForm() {
  const [profile, setProfile] = useState({
    // Admin-created fields (read-only)
    name: "",
    email: "",
    specialization: "",
    degree: "",
    experience_years: "",
    fees: "",
    address_line1: "",
    address_line2: "",
    about: "",
    available: true,
    image: "",
    
    // Doctor can only edit these fields
    phone: "",
    facebook: "",
    x: "",
    linkedin: "",
    instagram: "",
    country: "",
    city_state: "",
    postal_code: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiFetch(`${API_URL}/api/doctors/me`, {
        method: "GET",
        credentials: "include",
      });
      
      if (response) {
        setProfile({
          // Admin-created fields (auto-populated from admin data)
          name: response.name || "Dr. John Doe",
          email: response.email || "doctor@clinic.com",
          specialization: response.specialization || "General Physician",
          degree: response.degree || "MD",
          experience_years: response.experience_years || "5",
          fees: response.fees || response.consultation_fee || "50",
          address_line1: response.address_line1 || "123 Medical Street",
          address_line2: response.address_line2 || "Suite 100",
          about: response.about || "Experienced medical professional with expertise in patient care.",
          available: response.available !== undefined ? response.available : true,
          image: response.image || response.avatar_path || "",
          
          // Doctor can only edit these fields
          phone: response.phone || "",
          facebook: response.facebook || "",
          x: response.x || "",
          linkedin: response.linkedin || "",
          instagram: response.instagram || "",
          country: response.country || "",
          city_state: response.city_state || "",
          postal_code: response.postal_code || ""
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Only send doctor-editable fields
      const editableFields = {
        phone: profile.phone,
        facebook: profile.facebook,
        x: profile.x,
        linkedin: profile.linkedin,
        instagram: profile.instagram,
        country: profile.country,
        city_state: profile.city_state,
        postal_code: profile.postal_code
      };
      
      const response = await apiFetch(`${API_URL}/api/doctors/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editableFields),
        credentials: "include",
      });

      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage(err?.error || err?.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Admin-Created Information (Read-Only) */}
          <div className="rounded-lg p-6 border border-blue-400 dark:border-blue-400" style={{backgroundColor: '#0f172a'}}>
          <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 border-b border-blue-300 dark:border-blue-700 pb-2 mb-4">
            📋 Admin-Created Profile Information
          </h4>
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
            This information was created by the admin and cannot be edited here. Contact admin for changes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                disabled
                className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-300 bg-blue-400/60 dark:bg-blue-400/60 text-gray-800 dark:text-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-300 bg-blue-400/60 dark:bg-blue-400/60 text-gray-800 dark:text-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Specialization
              </label>
              <input
                type="text"
                value={profile.specialization}
                disabled
                className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-300 bg-blue-400/60 dark:bg-blue-400/60 text-gray-800 dark:text-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Degree
              </label>
              <input
                type="text"
                value={profile.degree}
                disabled
                className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-300 bg-blue-400/60 dark:bg-blue-400/60 text-gray-800 dark:text-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Experience (Years)
              </label>
              <input
                type="text"
                value={profile.experience_years ? `${profile.experience_years} years` : ""}
                disabled
                className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-300 bg-blue-400/60 dark:bg-blue-400/60 text-gray-800 dark:text-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Consultation Fees
              </label>
              <input
                type="text"
                value={profile.fees ? `€${profile.fees}` : ""}
                disabled
                className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-300 bg-blue-400/60 dark:bg-blue-400/60 text-gray-800 dark:text-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                value={profile.address_line1}
                disabled
                className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-300 bg-blue-400/60 dark:bg-blue-400/60 text-gray-800 dark:text-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={profile.address_line2}
                disabled
                className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-300 bg-blue-400/60 dark:bg-blue-400/60 text-gray-800 dark:text-gray-800 cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                About
              </label>
              <textarea
                value={profile.about}
                disabled
                rows={3}
                className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-300 bg-blue-400/60 dark:bg-blue-400/60 text-gray-800 dark:text-gray-800 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Doctor-Editable Information */}
          <div className="rounded-lg p-6 border border-blue-400 dark:border-blue-400" style={{backgroundColor: '#0f172a'}}>
          <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 border-b border-blue-300 dark:border-blue-700 pb-2 mb-4">
            ✏️ Your Contact & Social Information
          </h4>
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-6">
            You can edit your contact details and social media links below.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-400 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                style={{ backgroundColor: '#3B82F6' }}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Country
              </label>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-400 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                style={{ backgroundColor: '#3B82F6' }}
                placeholder="Enter your country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                City/State
              </label>
              <input
                type="text"
                value={profile.city_state}
                onChange={(e) => setProfile({ ...profile, city_state: e.target.value })}
                  className="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-400 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                style={{ backgroundColor: '#3B82F6' }}
                placeholder="Enter your city and state"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                value={profile.postal_code}
                onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                  className="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-400 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                style={{ backgroundColor: '#3B82F6' }}
                placeholder="Enter your postal code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Facebook
              </label>
              <input
                type="url"
                value={profile.facebook}
                onChange={(e) => setProfile({ ...profile, facebook: e.target.value })}
                  className="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-400 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                style={{ backgroundColor: '#3B82F6' }}
                placeholder="https://facebook.com/yourprofile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                X (Twitter)
              </label>
              <input
                type="url"
                value={profile.x}
                onChange={(e) => setProfile({ ...profile, x: e.target.value })}
                  className="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-400 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                style={{ backgroundColor: '#3B82F6' }}
                placeholder="https://x.com/yourprofile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                LinkedIn
              </label>
              <input
                type="url"
                value={profile.linkedin}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  className="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-400 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                style={{ backgroundColor: '#3B82F6' }}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Instagram
              </label>
              <input
                type="url"
                value={profile.instagram}
                onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                  className="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-400 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                style={{ backgroundColor: '#3B82F6' }}
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes("successfully") 
              ? "bg-green-100 text-green-800 border border-green-300" 
              : "bg-red-100 text-red-800 border border-red-300"
          }`}>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg border-2 border-blue-400 hover:bg-blue-600 hover:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}