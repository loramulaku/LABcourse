import React, { useEffect } from "react";
import "./css/style.css"; // stilet
import "./js/index.js"; // logjika me charts, alpine, flatpickr, dropzone

const Dashboard = () => {
  useEffect(() => {
    // Ky useEffect siguron që script-et e dashboard-it inicializohen
    // Nëse ke Alpine ose librari që varen nga DOM, kjo ndihmon
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden dark:bg-gray-900"
      x-data="{ page: 'ecommerce', loaded: true, darkMode: false, stickyMenu: false, sidebarToggle: false, scrollTop: false }"
    >
      {/* ===== Sidebar Start ===== */}
      <div>
        {/* kopjo përmbajtjen e partials/sidebar.html këtu */}
      </div>
      {/* ===== Sidebar End ===== */}

      {/* ===== Content Area Start ===== */}
      <div className="relative flex flex-col flex-1 overflow-x-hidden overflow-y-auto">
        {/* ===== Header Start ===== */}
        <div>
          {/* kopjo përmbajtjen e partials/header.html këtu */}
        </div>
        {/* ===== Header End ===== */}

        {/* ===== Main Content Start ===== */}
        <main>
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 space-y-6 xl:col-span-7">
                {/* Metric Group One */}
                {/* kopjo metric-group-01.html */}
                {/* Chart One */}
                {/* kopjo chart-01.html */}
              </div>

              <div className="col-span-12 xl:col-span-5">
                {/* Chart Two */}
                {/* kopjo chart-02.html */}
              </div>

              <div className="col-span-12">
                {/* Chart Three */}
                {/* kopjo chart-03.html */}
              </div>

              <div className="col-span-12 xl:col-span-5">
                {/* Map One */}
                {/* kopjo map-01.html */}
              </div>

              <div className="col-span-12 xl:col-span-7">
                {/* Table One */}
                {/* kopjo table-01.html */}
              </div>
            </div>
          </div>
        </main>
        {/* ===== Main Content End ===== */}
      </div>
      {/* ===== Content Area End ===== */}
    </div>
  );
};

export default Dashboard;
