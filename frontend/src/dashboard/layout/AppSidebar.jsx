import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

import {
  BoxCubeIcon,
  CalenderIcon,
  CloseIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

// ---------------- NAV ITEMS ----------------
const navItems = [
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/dashboard/profile",
  },
  {
    name: "User Management",
    icon: <TableIcon />,
    subItems: [
      { name: "Admin", path: "/dashboard/admin-users" },
      { name: "Users", path: "/dashboard/users" },
      { name: "Doctors", path: "/dashboard/doctors" },
      { name: "Laboratories", path: "/dashboard/laboratories" },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    subItems: [
      { name: "Analyses Calendar", path: "/dashboard/analyses-calendar" },
      { name: "Appointments Calendar", path: "/dashboard/appointments-calendar" },
    ],
  },
  {
    name: "Doctor Management",
    icon: <ListIcon />,
    subItems: [
      { name: "Departments", path: "/dashboard/departments" },
      { name: "Add Doctor", path: "/dashboard/add-doctor" },
      { name: "Edit & Delete Doctors", path: "/dashboard/doctors-crud" },
    ],
  },
  {
    name: "Laboratory Management",
    icon: <ListIcon />,
    subItems: [
      { name: "Add Laboratory", path: "/dashboard/add-laboratory" },
      { name: "Laboratories", path: "/dashboard/laboratories-crud" },
      { name: "Analysis Types", path: "/dashboard/analysis-types" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Contact Messages",
    path: "/dashboard/contact-messages",
  },
  {
    icon: <TableIcon />,
    name: "IPD Management",
    path: "/dashboard/ipd",
  },
  {
    icon: <TableIcon />,
    name: "Billing",
    subItems: [
      { name: "All Bills", path: "/dashboard/billing" },
      { name: "Create Bill", path: "/dashboard/billing/create" },
      { name: "Packages", path: "/dashboard/billing/packages" },
    ],
  },
]; 


// ---------------- COMPONENT ----------------
const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  // Active route check
  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  // Auto-open submenu if route matches
  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : [];
      items.forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType, index });
            submenuMatched = true;
          }
        });
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  // Measure submenu height for animation
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prev) =>
      prev && prev.type === menuType && prev.index === index
        ? null
        : { type: menuType, index }
    );
  };

  const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group cursor-pointer transition-all duration-200 hover:scale-105 ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group transition-all duration-200 hover:scale-105 ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`flex flex-col px-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-white h-screen transition-all duration-300 ease-in-out border-r border-white/20 dark:border-gray-700/50 fixed lg:relative z-50 shadow-xl
    ${isExpanded || isMobileOpen ? "w-[280px]" : isHovered ? "w-[280px]" : "w-[100px]"}
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dashboard Button */}
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
      >
        <Link
          to="/dashboard"
          className={`menu-item group transition-all duration-200 hover:scale-105 ${
            location.pathname === "/dashboard" ? "menu-item-active" : "menu-item-inactive"
          } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
        >
          <span
            className={`menu-item-icon-size ${
              location.pathname === "/dashboard"
                ? "menu-item-icon-active"
                : "menu-item-icon-inactive"
            }`}
          >
            <GridIcon />
          </span>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="menu-item-text">Welcome to Dashboard</span>
          )}
        </Link>
      </div>

      {/* Menu */}
      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6 flex flex-col gap-4">
          <div>
            <h2
              className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-300 ${
                !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="size-6" />}
            </h2>
            {renderMenuItems(navItems, "main")}
          </div>
        </nav>
      </div>

      {/* Back to Home link */}
      <div className="mt-auto mb-6">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
        >
          <Home className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
