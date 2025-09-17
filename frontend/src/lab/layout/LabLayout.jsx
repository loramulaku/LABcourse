import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function LabLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Modern Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-green-600 to-green-700 shadow-xl min-h-screen">
          <div className="p-6">
            {/* Branding */}
            <div className="flex items-center mb-8">
              <img src="/src/lab/labicon/1.jpg" alt="Lab" className="w-10 h-10 rounded-full mr-3" />
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
                      ? 'bg-white bg-opacity-20 shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`
                }
              >
                <img src="/src/lab/labicon/5.jpg" alt="Profile" className="w-5 h-5 mr-3" />
                My Profile
              </NavLink>

              <NavLink 
                to="/lab/analysis-types" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive 
                      ? 'bg-white bg-opacity-20 shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`
                }
              >
                <img src="/src/lab/labicon/3.jpg" alt="Analysis" className="w-5 h-5 mr-3" />
                Add Analysis Type
              </NavLink>

              <NavLink 
                to="/lab/history" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive 
                      ? 'bg-white bg-opacity-20 shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`
                }
              >
                <img src="/src/lab/labicon/2.jpg" alt="History" className="w-5 h-5 mr-3" />
                Patient History
              </NavLink>

              <NavLink 
                to="/lab/calendar" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive 
                      ? 'bg-white bg-opacity-20 shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`
                }
              >
                <img src="/src/lab/labicon/6.jpg" alt="Calendar" className="w-5 h-5 mr-3" />
                Appointments Calendar
              </NavLink>

              <NavLink 
                to="/lab/confirmed" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive 
                      ? 'bg-white bg-opacity-20 shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`
                }
              >
                <img src="/src/lab/labicon/4.jpg" alt="Confirmed" className="w-5 h-5 mr-3" />
                Confirmed Patients
              </NavLink>

              <NavLink 
                to="/lab/pending" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 rounded-lg text-white transition-all duration-200 ${
                    isActive 
                      ? 'bg-white bg-opacity-20 shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`
                }
              >
                <img src="/src/lab/labicon/7.jpg" alt="Pending" className="w-5 h-5 mr-3" />
                Pending Patients
              </NavLink>
            </nav>

            {/* Back to App Button */}
            <div className="mt-8 pt-6 border-t border-green-500">
              <button 
                onClick={() => navigate('/')} 
                className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to App
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


