import React from "react";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../../dashboard/context/SidebarContext";
import DoctorSidebar from "./DoctorSidebar.jsx";
import Backdrop from "../../dashboard/layout/Backdrop";
import SearchBar from "../../dashboard/components/SearchBar";

const DoctorLayout = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div className="flex h-screen text-gray-900">
      {/* Doctor Sidebar */}
      <DoctorSidebar />

      {/* Backdrop for mobile */}
      {isMobileOpen && <Backdrop onClick={toggleMobileSidebar} />}

      {/* Main content */}
      <div className="flex flex-col flex-1">

        {/* Content */}
        <main className="flex-1 p-8 w-full min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
