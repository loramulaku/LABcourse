import React, { useState } from "react";
import { useSidebar } from "../context/SidebarContext";
import { Search, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import LazyImage from "../../components/LazyImage";
import { assets } from "../../assets/assets";
import { createPortal } from "react-dom";

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [token] = useState(!!localStorage.getItem("accessToken"));
  const [role] = useState(localStorage.getItem("role"));
  const [userInfo] = useState<any>(null); // kept since you had it
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      navigate("/login");
    } catch (err) {
      console.error("Error during logout", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      navigate("/login");
    }
  };

  const getProfilePhotoUrl = () => {
    if (!userInfo || !userInfo.profilePhoto) {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      return `${API_URL}/uploads/avatars/default.png`;
    }

    if (userInfo.profilePhoto.startsWith("http")) {
      return userInfo.profilePhoto;
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${API_URL}${userInfo.profilePhoto}`;
  };

  const navigateToProfile = () => {
    if (role === "admin") {
      navigate("/dashboard/profile");
    } else if (role === "doctor") {
      navigate("/doctor/profile");
    } else if (role === "lab") {
      navigate("/lab/profile");
    } else {
      navigate("/my-profile");
    }
  };

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Sidebar toggle button */}
      <button
        onClick={toggleSidebar}
        className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search across all data..."
          className="w-full rounded-xl border border-white/30 dark:border-gray-600/50 bg-white/50 dark:bg-gray-700/50 py-3 pl-12 pr-4 text-sm 
                     text-gray-900 placeholder-gray-500 backdrop-blur-sm
                     focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 focus:bg-white/70 dark:focus:bg-gray-700/70
                     dark:text-white dark:placeholder-gray-400 transition-all duration-300"
        />
      </div>

      {/* Notification Bell & Profile */}
      <div className="flex items-center gap-4 relative">
        {token && role !== "lab" && <NotificationBell />}
        {token && (
          <div
            className="flex items-center gap-2 cursor-pointer relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
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
                fallbackSrc={`${
                  import.meta.env.VITE_API_URL || "http://localhost:5000"
                }/uploads/avatars/default.png`}
                placeholder={
                  <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
                }
              />
            )}
            <img className="w-2.5" src={assets.dropdown_icon} alt="Dropdown" />

            {/* Dropdown via portal */}
            {dropdownOpen &&
              createPortal(
                <div
                  className="fixed top-[60px] right-4 text-base font-medium text-gray-600 
                            z-[999999] transition-all duration-200"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="min-w-48 bg-white dark:bg-gray-800 rounded-lg flex flex-col gap-4 p-4 shadow-xl border border-gray-200 dark:border-gray-700">
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
                </div>,
                document.body
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
