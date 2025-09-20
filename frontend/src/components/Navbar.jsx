import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import apiFetch from "../api";
import LazyImage from "./LazyImage";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(!!localStorage.getItem("accessToken"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch user profile info for navbar
  const fetchUserInfo = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      console.log("No access token found, user not authenticated");
      setToken(false);
      return;
    }

    console.log(
      "Fetching user info with token:",
      accessToken.substring(0, 20) + "...",
    );

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const data = await apiFetch(`${API_URL}/api/auth/navbar-info`);
      setUserInfo(data);
    } catch (err) {
      console.error("Error fetching user info:", err);
      // If 401/403, user is not authenticated, clear token
      if (err.status === 401 || err.status === 403) {
        console.log("User not authenticated, clearing tokens");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("role");
        setToken(false);
        setRole(null);
        setUserInfo(null);
        return;
      }
      // Fallback to default values for other errors
      console.log("Using fallback user info");
      setUserInfo({
        profilePhoto: "/uploads/avatars/default.png",
        name: "User",
        role: role,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserInfo();
    }
  }, [token]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      setToken(false);
      setRole(null);
      setUserInfo(null);
      navigate("/login");
    } catch (err) {
      console.error("Gabim gjatë logout", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      setToken(false);
      setRole(null);
      setUserInfo(null);
      navigate("/login");
    }
  };

  const handleLogin = () => {
    setToken(true);
    setRole(localStorage.getItem("role"));
  };

  useEffect(() => {
    window.handleLogin = handleLogin;
  }, []);

  const goToSignUp = () => {
    navigate("/login");
  };

  // Get the correct profile photo URL
  const getProfilePhotoUrl = () => {
    if (!userInfo || !userInfo.profilePhoto) {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      return `${API_URL}/uploads/avatars/default.png`;
    }

    // If it's already a full URL, return as is
    if (userInfo.profilePhoto.startsWith("http")) {
      return userInfo.profilePhoto;
    }

    // If it's a relative path, construct the full URL
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${API_URL}${userInfo.profilePhoto}`;
  };

  // Navigate to the correct profile page based on user role
  const navigateToProfile = () => {
    if (role === "admin") {
      navigate("/dashboard/profile");
    } else {
      navigate("/my-profile");
    }
  };

  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400">
      {/* Branding */}
      {token && role === "lab" ? (
        <div className="flex items-center gap-3 select-none">
          <img src={assets.lab_icon} alt="Lab" className="w-8 h-8" />
          <button
            onClick={() => navigate("/lab/history")}
            className="text-xl font-semibold tracking-tight hover:text-blue-700"
          >
            {userInfo?.name || "Laboratory"}
          </button>
        </div>
      ) : (
        <img
          onClick={() => navigate("/")}
          className="w-44 cursor-pointer"
          src={assets.logo}
          alt="Logo"
        />
      )}

      {/* Menu links */}
      <ul className="hidden md:flex items-start gap-5 font-medium">
        <NavLink to="/">
          <li>HOME</li>
        </NavLink>
        <NavLink to="/doctors">
          <li>ALL DOCTORS</li>
        </NavLink>
        <NavLink to="/about">
          <li>ABOUT</li>
        </NavLink>
        <NavLink to="/contact">
          <li>CONTACT</li>
        </NavLink>
      </ul>

      {/* Profile / Auth */}
      <div className="flex items-center gap-4">
        {token && role !== "lab" && <NotificationBell />}
        {token ? (
          <div className="flex items-center gap-2 cursor-pointer group relative">
            {role === "lab" ? (
              <img
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-600"
                src="/src/lab/labicon/1.jpg"
                alt="Lab Profile"
              />
            ) : (
              <LazyImage
                className="w-8 h-8 rounded-full object-cover"
                src={getProfilePhotoUrl()}
                alt="Profile"
                fallbackSrc={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/avatars/default.png`}
                placeholder={
                  <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
                }
              />
            )}
            <img className="w-2.5" src={assets.dropdown_icon} alt="Dropdown" />

            {/* Dropdown */}
            <div
              className="absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 
                            z-20 opacity-0 pointer-events-none 
                            group-hover:opacity-100 group-hover:pointer-events-auto 
                            transition-all duration-200"
            >
              <div className="min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4 shadow-lg">
                {role === "lab" ? (
                  <>
                    <p
                      onClick={() => navigate("/lab/profile")}
                      className="hover:text-black cursor-pointer"
                    >
                      Lab Profile
                    </p>
                    <p
                      onClick={() => navigate("/lab/history")}
                      className="hover:text-black cursor-pointer"
                    >
                      Lab Dashboard
                    </p>
                    <p
                      onClick={handleLogout}
                      className="hover:text-black cursor-pointer"
                    >
                      Log Out
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      onClick={navigateToProfile}
                      className="hover:text-black cursor-pointer"
                    >
                      My Profile
                    </p>
                    <p
                      onClick={() => navigate("/my-appointments")}
                      className="hover:text-black cursor-pointer"
                    >
                      My Appointments
                    </p>
                    <p
                      onClick={() => navigate("/my-analyses")}
                      className="hover:text-black cursor-pointer"
                    >
                      My Analyses
                    </p>
                    {role === "admin" && (
                      <p
                        onClick={() => navigate("/dashboard")}
                        className="hover:text-black cursor-pointer"
                      >
                        Admin Dashboard
                      </p>
                    )}
                    <p
                      onClick={handleLogout}
                      className="hover:text-black cursor-pointer"
                    >
                      Logout
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={goToSignUp}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 
                       rounded-full font-medium hidden md:block transition-colors"
          >
            Create Account
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
