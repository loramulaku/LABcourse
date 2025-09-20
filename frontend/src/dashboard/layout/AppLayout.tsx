// AppLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import AppSidebar from "./AppSidebar.jsx";
import Backdrop from "./Backdrop";
import SearchBar from "../components/SearchBar";

const AppLayout: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar, searchQuery } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-200">
      {/* Sidebar */}
      <AppSidebar />

      {/* Backdrop pÃ«r mobile */}
      {isMobileOpen && <Backdrop onClick={toggleMobileSidebar} />}

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Search bar global */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <SearchBar />
        </div>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
