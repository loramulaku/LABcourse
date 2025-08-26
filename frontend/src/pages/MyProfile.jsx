import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

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

  // ✅ Load profile from backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // ⚡ siguro që të dhënat e adresës kthehen në objekt
        setUserData({
          ...data,
          address: {
            line1: data.address?.line1 || data.address_line1 || "",
            line2: data.address?.line2 || data.address_line2 || "",
          },
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // ✅ Save profile
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    formData.append("phone", userData.phone);
    formData.append("address_line1", userData.address.line1);
    formData.append("address_line2", userData.address.line2);
    formData.append("gender", userData.gender);
    formData.append("dob", userData.dob || "");
    if (file) formData.append("profile_image", file);

    // Debug për të parë çka po dërgon
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      // 🔥 rifresko gjithë userData sipas backend
      setUserData((prev) => ({
        ...prev,
        phone: formData.get("phone"),
        gender: formData.get("gender"),
        dob: data.dob || prev.dob,
        address: {
          line1: formData.get("address_line1"),
          line2: formData.get("address_line2"),
        },
        profile_image: data.profile_image || prev.profile_image,
      }));

      setIsEdit(false);
      setFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Remove photo
  const handleRemovePhoto = async () => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("removePhoto", "true");

    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      setUserData((prev) => ({
        ...prev,
        profile_image: data.profile_image || "uploads/default.png",
      }));
      setFile(null);
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