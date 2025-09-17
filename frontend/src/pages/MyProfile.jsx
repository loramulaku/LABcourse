import React, { useEffect, useState } from "react";
import apiFetch, { API_URL } from '../api'; // 🔹 wrapper me auto-refresh të token-it

const MyProfile = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: { line1: "", line2: "" },
    gender: "",
    dob: "",
    profile_image: "uploads/default.png",
  });

  const [isEdit, setIsEdit] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load profile from backend me apiFetch (auto-refresh token)
  useEffect(() => {
  const loadProfile = async () => {
    try {
      console.log("Loading profile from:", `${API_URL}/api/profile`);
      const data = await apiFetch(`${API_URL}/api/profile`);
      console.log("Profile data received:", data);

      setUserData({
        ...data,
        address: {
          line1: data.address?.line1 || data.address_line1 || "",
          line2: data.address?.line2 || data.address_line2 || "",
        },
      });
      setLoading(false);
    } catch (err) {
      console.error("Gabim gjatë marrjes së profilit:", err);
      setLoading(false);
    }
  };
  loadProfile();
}, []);


  // ✅ Save profile me apiFetch (header Authorization automatik)
  const handleSave = async () => {
  try {
    const formData = new FormData();
    formData.append("phone", userData.phone);
    formData.append("address_line1", userData.address.line1);
    formData.append("address_line2", userData.address.line2);
    formData.append("gender", userData.gender);
    formData.append("dob", userData.dob);
    if (file) formData.append("profile_image", file);

    const data = await apiFetch(`${API_URL}/api/profile`, {
      method: "PUT",
      body: formData,
    });

    setUserData((prev) => ({ ...prev, ...data }));
    setIsEdit(false);
  } catch (err) {
    console.error(err);
  }
};

  // ✅ Remove photo me apiFetch
const handleRemovePhoto = async () => {
  try {
    const formData = new FormData();
    formData.append("removePhoto", "true");

    const data = await apiFetch(`${API_URL}/api/profile`, {
      method: "PUT",
      body: formData,
    });

    setUserData((prev) => ({ ...prev, ...data }));
  } catch (err) {
    console.error(err);
  }
};

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="max-w-lg flex flex-col gap-3 text-sm">
      <img
        className="w-36 h-36 rounded object-cover border"
        src={`${API_URL}/${userData.profile_image}`}
        alt="Profile"
      />

      {isEdit && (
        <div className="flex gap-2 items-center">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="border px-2 py-1"
          />
          <button
            onClick={handleRemovePhoto}
            className="border px-2 py-1 rounded hover:bg-red-500 hover:text-white"
          >
            Remove Photo
          </button>
        </div>
      )}

      <label>Name:</label>
      <input
        type="text"
        value={userData.name}
        disabled
        className="bg-gray-100 border px-2 py-1"
      />

      <label>Email:</label>
      <input
        type="text"
        value={userData.email}
        disabled
        className="bg-gray-100 border px-2 py-1"
      />

      <label>Phone:</label>
      <input
        type="text"
        value={userData.phone}
        onChange={(e) =>
          setUserData((prev) => ({
            ...prev,
            phone: e.target.value.replace(/\D/, ""),
          }))
        }
        disabled={!isEdit}
        className="bg-gray-100 border px-2 py-1"
      />

      <label>Address Line 1:</label>
      <input
        type="text"
        value={userData.address.line1}
        onChange={(e) =>
          setUserData((prev) => ({
            ...prev,
            address: { ...prev.address, line1: e.target.value },
          }))
        }
        disabled={!isEdit}
        className="bg-gray-100 border px-2 py-1"
      />

      <label>Address Line 2:</label>
      <input
        type="text"
        value={userData.address.line2}
        onChange={(e) =>
          setUserData((prev) => ({
            ...prev,
            address: { ...prev.address, line2: e.target.value },
          }))
        }
        disabled={!isEdit}
        className="bg-gray-100 border px-2 py-1"
      />

      <label>Gender:</label>
      <select
        value={userData.gender}
        onChange={(e) =>
          setUserData((prev) => ({ ...prev, gender: e.target.value }))
        }
        disabled={!isEdit}
        className="bg-gray-100 border px-2 py-1"
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>

      <label>Date of Birth:</label>
      <input
        type="date"
        value={userData.dob}
        onChange={(e) =>
          setUserData((prev) => ({ ...prev, dob: e.target.value }))
        }
        disabled={!isEdit}
        className="bg-gray-100 border px-2 py-1"
      />

      <button
        onClick={isEdit ? handleSave : () => setIsEdit(true)}
        className="border px-4 py-2 rounded hover:bg-blue-500 hover:text-white mt-2"
      >
        {isEdit ? "Save" : "Edit"}
      </button>
    </div>
  );
};

export default MyProfile;
