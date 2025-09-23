import React from "react";
import DoctorProfileForm from "../../dashboard/components/DoctorProfileForm";

export default function DoctorProfile() {
  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your professional information and contact details
          </p>
        </div>
      </div>

      <DoctorProfileForm />
    </div>
  );
}