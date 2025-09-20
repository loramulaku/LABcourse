import React from "react";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../../dashboard/context/SidebarContext";
import DoctorSidebar from "./DoctorSidebar.jsx";
import Backdrop from "../../dashboard/layout/Backdrop";
import SearchBar from "../../dashboard/components/SearchBar";

const DoctorLayout = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-200">
      {/* Doctor Sidebar */}
      <DoctorSidebar />

      {/* Backdrop for mobile */}
      {isMobileOpen && <Backdrop onClick={toggleMobileSidebar} />}

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Search bar global */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <SearchBar />
        </div>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
