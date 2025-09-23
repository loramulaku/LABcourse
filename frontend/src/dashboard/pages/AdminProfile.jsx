//C:\ProjektiLab\frontend\src\dashboard\pages\AdminProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

import UserMetaCard from "../components/AdminProfile/UserMetaCard";
import UserInfoCard from "../components/AdminProfile/UserInfoCard";
import UserAddressCard from "../components/AdminProfile/UserAddressCard";
import AddDoctorCard from "../components/AdminProfile/AddDoctorCard";
import DoctorsTable from "../components/AdminProfile/DoctorsTable";

import apiFetch, { getAccessToken } from "../../api";

const BASE_API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_PROFILE_BASE = `${BASE_API}/api/admin-profiles`;

function decodeJwtPayload() {
  try {
    const token = getAccessToken();
    if (!token) return {};
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload || {};
  } catch {
    return {};
  }
}

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [refreshDoctors, setRefreshDoctors] = useState(0);

  const tokenData = useMemo(() => decodeJwtPayload(), []);
  const userId = tokenData?.id || tokenData?.sub || null;

  const fullAvatarUrl = (p) => {
    if (!p || p === "/uploads/avatars/default.png" || p === "") {
      return `${BASE_API}/uploads/avatars/default.png`;
    }
    return p.startsWith("http") ? p : `${BASE_API}${p}`;
  };

  const handleAvatarError = (e) => {
    e.target.src = `${BASE_API}/uploads/avatars/default.png`;
  };

  async function fetchProfile() {
    try {
      const data = await apiFetch(`${ADMIN_PROFILE_BASE}/me`, {
        method: "GET",
      });
      setProfile(data);

      // Fetch user data from users table
      const userResponse = await apiFetch(`${BASE_API}/api/users/me`, {
        method: "GET",
      });
      setUserData(userResponse);
    } catch (e) {
      // nëse nuk ekziston ende, backendi mund ta krijojë default-in;
      // për frontin thjesht shfaq default-et
      setProfile({
        user_id: userId,
        first_name: "",
        last_name: "",
        phone: "",
        bio: "Team Manager",
        avatar_path: "/uploads/avatars/default.png",
        facebook: "",
        x: "",
        linkedin: "",
        instagram: "",
        country: "",
        city_state: "",
        postal_code: "",
        tax_id: "",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- handlers update -------
  const updatePersonal = async (payload, avatarFile) => {
    // 1) avatar (nëse është zgjedhur)
    if (avatarFile) {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      const r = await apiFetch(`${ADMIN_PROFILE_BASE}/avatar`, {
        method: "POST",
        body: fd,
      });
      payload.avatar_path = r.avatar_path; // rruga e kthyer nga backend
    } else {
      // If no avatar file is selected, use default
      payload.avatar_path = "/uploads/avatars/default.png";
    }

    // 2) personal & social
    const updated = await apiFetch(`${ADMIN_PROFILE_BASE}/personal`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const updateAddress = async (payload) => {
    const updated = await apiFetch(`${ADMIN_PROFILE_BASE}/address`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  if (loading || !profile) {
    return (
      <>
        <PageMeta title="Profile" description="Admin Profile" />
        <PageBreadcrumb pageTitle="Profile" />
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </>
    );
  }

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <PageMeta title="Profile" description="Admin Profile" />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your admin profile and team</p>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
        <div className="space-y-8">
          <UserMetaCard
            name={userData.name || ""}
            email={userData.email || ""}
            roleLabel="Team Manager"
            avatarUrl={fullAvatarUrl(profile.avatar_path)}
            onAvatarError={handleAvatarError}
            socials={{
              facebook: profile.facebook,
              x: profile.x,
              linkedin: profile.linkedin,
              instagram: profile.instagram,
            }}
          />

          <UserInfoCard
            name={userData.name || ""}
            email={userData.email || ""}
            profile={profile}
            onSave={(payload, avatarFile) =>
              updatePersonal(payload, avatarFile)
            }
          />

          <UserAddressCard
            profile={profile}
            onSave={(payload) => updateAddress(payload)}
          />

          <AddDoctorCard onDoctorAdded={() => setRefreshDoctors(prev => prev + 1)} />

          <DoctorsTable key={refreshDoctors} />
        </div>
      </div>
    </div>
  );
}
