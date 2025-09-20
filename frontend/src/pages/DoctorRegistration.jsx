import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorRegistration = () => {
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Professional Info
    licenseNumber: '',
    medicalField: '',
    specialization: '',
    experienceYears: '',
    education: '',
    previousClinic: '',
    
    // Additional
    phone: '',
    bio: ''
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.licenseNumber || !formData.medicalField) {
      setMessage('License number and medical field are required');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create user account
      const userResponse = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'doctor'
        }),
        credentials: 'include'
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        setMessage(userData.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Step 2: Create doctor application
      const applicationResponse = await fetch('http://localhost:5000/api/doctors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseNumber: formData.licenseNumber,
          medicalField: formData.medicalField,
          specialization: formData.specialization,
          experienceYears: formData.experienceYears,
          education: formData.education,
          previousClinic: formData.previousClinic,
          phone: formData.phone,
          bio: formData.bio
        }),
        credentials: 'include'
      });

      const applicationData = await applicationResponse.json();

      if (!applicationResponse.ok) {
        setMessage(applicationData.error || 'Failed to submit application');
        setLoading(false);
        return;
      }

      setMessage('Application submitted successfully! Please wait for admin verification.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error(err);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-4xl mx-4">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Doctor Registration
          </h2>
          
          {message && (
            <div className={`p-4 rounded-md mb-6 ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">
                Basic Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">
                Professional Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Field *
                </label>
                <select
                  name="medicalField"
                  value={formData.medicalField}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Medical Field</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Gastroenterology">Gastroenterology</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Oncology">Oncology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Interventional Cardiology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education Background
                </label>
                <textarea
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="e.g., MD from Harvard Medical School, Residency at Johns Hopkins"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Clinic/Hospital
                </label>
                <input
                  type="text"
                  name="previousClinic"
                  value={formData.previousClinic}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Mayo Clinic"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Tell us about your medical practice and approach to patient care..."
            />
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-md transition-colors duration-200"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline"
              >
                Login here
              </button>
            </p>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Your application will be reviewed by our admin team. 
              You will receive an email notification once your account is verified. 
              This process typically takes 1-2 business days.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorRegistration;
