import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  CloseIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
} from "../../dashboard/icons";
import { useSidebar } from "../../dashboard/context/SidebarContext";
import SidebarWidget from "../../dashboard/layout/SidebarWidget";

// Navigation item structure
// SubItem: { name: string, path: string, pro?: boolean, new?: boolean }
// NavItem: { name: string, icon: React.ReactNode, path?: string, subItems?: SubItem[] }

// Doctor-specific navigation items
const navItems = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/doctor/dashboard",
  },
  {
    icon: <CalenderIcon />,
    name: "Appointments",
    subItems: [
      { name: "All Appointments", path: "/doctor/appointments" },
      { name: "Calendar View", path: "/doctor/calendar" },
      { name: "Statistics", path: "/doctor/appointment-stats" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Patients",
    subItems: [
      { name: "Patient List", path: "/doctor/patients" },
      { name: "Patient Profile", path: "/doctor/patient-profile" },
    ],
  },
  {
    name: "Therapy Management",
    icon: <PageIcon />,
    subItems: [
      { name: "Active Therapies", path: "/doctor/therapies" },
      { name: "Create Therapy", path: "/doctor/therapy/create" },
      { name: "Therapy History", path: "/doctor/therapy/history" },
    ],
  },
  {
    name: "Prescriptions",
    icon: <ListIcon />,
    subItems: [
      { name: "Create Prescription", path: "/doctor/prescription/create" },
      { name: "Prescription History", path: "/doctor/prescription/history" },
    ],
  },
  {
    name: "Documents",
    icon: <BoxCubeIcon />,
    subItems: [
      { name: "Upload Documents", path: "/doctor/documents/upload" },
      { name: "Patient Files", path: "/doctor/documents/files" },
    ],
  },
];

const othersItems = [
  {
    icon: <UserCircleIcon />,
    name: "Profile",
    path: "/doctor/profile",
  },
  {
    icon: <PieChartIcon />,
    name: "Analytics",
    subItems: [
      { name: "Patient Analytics", path: "/doctor/analytics/patients" },
      { name: "Therapy Analytics", path: "/doctor/analytics/therapies" },
    ],
  },
];

const DoctorSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  // Active route check
  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname],
  );

  // Auto-open submenu if route matches
  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType as "main" | "others", index });
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
        : { type: menuType, index },
    );
  };

  const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group cursor-pointer ${
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
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
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
      className={`flex flex-col px-5 bg-white dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out border-r border-gray-200
    ${isExpanded || isMobileOpen ? "w-[240px]" : isHovered ? "w-[240px]" : "w-[90px]"}

      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
      >
        <Link to="/doctor/dashboard">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Menu */}
      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6 flex flex-col gap-4">
          <div>
            <h2
              className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? (
                "Doctor Menu"
              ) : (
                <HorizontaLDots className="size-6" />
              )}
            </h2>
            {renderMenuItems(navItems, "main")}
          </div>

          <div>
            <h2
              className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? (
                "Others"
              ) : (
                <HorizontaLDots />
              )}
            </h2>
            {renderMenuItems(othersItems, "others")}
          </div>
        </nav>

        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="mt-auto mb-4">
            <SidebarWidget
              to="/logout"
              icon={<CloseIcon className="w-5 h-5" />}
              label="Logout"
            />
          </div>
        )}
      </div>
    </aside>
  );
};

export default DoctorSidebar;
