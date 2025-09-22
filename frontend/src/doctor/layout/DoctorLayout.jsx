import React from "react";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../../dashboard/context/SidebarContext";
import DoctorSidebar from "./DoctorSidebar.jsx";
import Backdrop from "../../dashboard/layout/Backdrop";
import SearchBar from "../../dashboard/components/SearchBar";

const DoctorLayout = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div className="flex h-screen" style={{backgroundColor: '#1e293b', color: 'white'}}>
      {/* Doctor Sidebar */}
      <DoctorSidebar />

      {/* Backdrop for mobile */}
      {isMobileOpen && <Backdrop onClick={toggleMobileSidebar} />}

      {/* Main content - Extended blue background to cover ALL yellow highlighted areas */}
      <div className="flex flex-col flex-1" style={{backgroundColor: '#1e293b'}}>
        {/* Search bar global - Extended blue background covering the entire top area */}
        <div className="p-6 border-b border-slate-700 w-full" style={{backgroundColor: '#1e293b'}}>
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <SearchBar />
            </div>
          </div>
        </div>

        {/* Content - Extended blue background covering ALL dashboard content areas */}
        <main className="flex-1 p-8 w-full min-h-screen" style={{backgroundColor: '#1e293b'}}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
