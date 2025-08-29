// src/components/layout/AppLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";

const AppLayout: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AppSidebar />

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <Backdrop onClick={toggleMobileSidebar} />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <AppHeader />

        {/* Page Content */}
        <main className="mt-16 flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
