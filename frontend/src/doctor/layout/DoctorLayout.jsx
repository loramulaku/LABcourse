import React from "react";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../../dashboard/context/SidebarContext";
import DoctorSidebar from "./DoctorSidebar.jsx";
import Backdrop from "../../dashboard/layout/Backdrop";
import SearchBar from "../../dashboard/components/SearchBar";

const DoctorLayout = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Doctor Sidebar */}
      <DoctorSidebar />

      {/* Backdrop for mobile */}
      {isMobileOpen && <Backdrop onClick={toggleMobileSidebar} />}

      {/* Main content */}
      <div className="flex flex-col flex-1 bg-slate-900">
        {/* Search bar global */}
        <div className="p-6 border-b border-slate-700 w-full bg-slate-900">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <SearchBar />
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-8 w-full min-h-screen bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
