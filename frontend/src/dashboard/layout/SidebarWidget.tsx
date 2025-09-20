// src/components/layout/SidebarWidget.tsx
import React from "react";
import { NavLink } from "react-router-dom";

interface SidebarWidgetProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarWidget: React.FC<SidebarWidgetProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors 
         ${
           isActive
             ? "bg-primary text-primary-foreground"
             : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
         }`
      }
    >
      <span className="w-6 h-6">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
};

export default SidebarWidget;
