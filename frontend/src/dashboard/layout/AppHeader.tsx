// src/components/layout/AppHeader.tsx
import React from "react";
import { useSidebar } from "../context/SidebarContext";
import { HorizontaLDots, AlertIcon, UserCircleIcon, EyeIcon } from "../icons"; 

const AppHeader: React.FC = () => {
  const { toggleMobileSidebar } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 lg:px-6">
      {/* Sidebar toggle (mobile) */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <HorizontaLDots className="w-6 h-6" />
      </button>

      {/* Search bar */}
      <div className="hidden md:flex items-center ml-4 flex-1 max-w-md">
        <div className="relative w-full">
          <EyeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
          <AlertIcon className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <UserCircleIcon className="w-8 h-8 text-gray-500 dark:text-gray-300" />
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
              John Doe
            </span>
          </button>
          {/* TODO: vendos dropdown menu këtu */}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
