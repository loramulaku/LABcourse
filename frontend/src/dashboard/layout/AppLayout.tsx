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
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <AppSidebar />

      {/* Backdrop for mobile */}
      {isMobileOpen && <Backdrop onClick={toggleMobileSidebar} />}

      {/* Main content */}
      <div className="flex flex-col flex-1 mx-0 px-0">
        {/* Search bar global */}
        <div className="p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-white/20 dark:border-gray-700/50">
          <SearchBar />
        </div>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto no-scrollbar bg-transparent">
          <div className="w-full max-w-full mx-0">
            <Outlet context={{ searchQuery }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
