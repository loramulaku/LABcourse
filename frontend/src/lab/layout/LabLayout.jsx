import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function LabLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
      <div className="flex">
        {/* Modern Sidebar */}
        <aside className="w-64 bg-green-900 shadow-2xl min-h-screen border-r-2 border-green-600">
          <div className="p-6">
            {/* Branding */}
            <div className="flex items-center mb-8">
              <img
                src="/src/lab/labicon/1.jpg"
                alt="Lab"
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <h1 className="text-white text-xl font-bold">Lab Dashboard</h1>
                <p className="text-green-100 text-sm">Management System</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              <NavLink
                to="/lab/profile"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive
                      ? "bg-green-600 bg-opacity-40 shadow-lg border border-green-400"
                      : "hover:bg-green-700 hover:bg-opacity-30"
                  }`
                }
              >
                <img
                  src="/src/lab/labicon/5.jpg"
                  alt="Profile"
                  className="w-5 h-5 mr-3"
                />
                My Profile
              </NavLink>

              <NavLink
                to="/lab/analysis-types"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive
                      ? "bg-green-600 bg-opacity-40 shadow-lg border border-green-400"
                      : "hover:bg-green-700 hover:bg-opacity-30"
                  }`
                }
              >
                <img
                  src="/src/lab/labicon/3.jpg"
                  alt="Analysis"
                  className="w-5 h-5 mr-3"
                />
                Add Analysis Type
              </NavLink>

              <NavLink
                to="/lab/history"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive
                      ? "bg-green-600 bg-opacity-40 shadow-lg border border-green-400"
                      : "hover:bg-green-700 hover:bg-opacity-30"
                  }`
                }
              >
                <img
                  src="/src/lab/labicon/2.jpg"
                  alt="History"
                  className="w-5 h-5 mr-3"
                />
                Patient History
              </NavLink>

              <NavLink
                to="/lab/calendar"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive
                      ? "bg-green-600 bg-opacity-40 shadow-lg border border-green-400"
                      : "hover:bg-green-700 hover:bg-opacity-30"
                  }`
                }
              >
                <img
                  src="/src/lab/labicon/6.jpg"
                  alt="Calendar"
                  className="w-5 h-5 mr-3"
                />
                Appointments Calendar
              </NavLink>

              <NavLink
                to="/lab/confirmed"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive
                      ? "bg-green-600 bg-opacity-40 shadow-lg border border-green-400"
                      : "hover:bg-green-700 hover:bg-opacity-30"
                  }`
                }
              >
                <img
                  src="/src/lab/labicon/4.jpg"
                  alt="Confirmed"
                  className="w-5 h-5 mr-3"
                />
                Confirmed Patients
              </NavLink>

              <NavLink
                to="/lab/pending"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive
                      ? "bg-green-600 bg-opacity-40 shadow-lg border border-green-400"
                      : "hover:bg-green-700 hover:bg-opacity-30"
                  }`
                }
              >
                <img
                  src="/src/lab/labicon/7.jpg"
                  alt="Pending Result"
                  className="w-5 h-5 mr-3"
                />
                Pending Result
              </NavLink>

              <NavLink
                to="/lab/inbox"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive
                      ? "bg-green-600 bg-opacity-40 shadow-lg border border-green-400"
                      : "hover:bg-green-700 hover:bg-opacity-30"
                  }`
                }
              >
                <img
                  src="/src/lab/labicon/1.jpg"
                  alt="Inbox"
                  className="w-5 h-5 mr-3"
                />
                Inbox
              </NavLink>
            </nav>

            {/* Back to App Button */}
            <div className="mt-8 pt-6 border-t border-green-500">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to App
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-300 min-h-screen">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
