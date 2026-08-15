import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MaintenanceBanner from "./MaintenanceBanner";
import { MaintenanceProvider } from "../../context/MaintenanceContext";
import { AdminUnreadProvider } from "../../context/AdminUnreadContext";

/**
 * AdminLayout — main layout for all admin pages.
 * Sidebar (always dark navy) + Header + Content area.
 * Respects the global theme toggle (light/dark).
 */
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <MaintenanceProvider>
      <AdminUnreadProvider>
        <div className="min-h-screen bg-[#f5f7fb] dark:bg-navy-950">
          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <Sidebar
            open={sidebarOpen}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div
            className={`transition-all duration-300 ${
              sidebarOpen ? "lg:ml-64" : "lg:ml-20"
            }`}
          >
            {/* Header */}
            <Header
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onMobileMenuClick={() => setMobileSidebarOpen(true)}
            />

            {/* Maintenance-mode reminder (renders only when active) */}
            <div className="mt-16">
              <MaintenanceBanner />
            </div>

            {/* Page Content */}
            <main className="p-4 sm:p-6 lg:p-8">
              <Outlet />
            </main>
          </div>
        </div>
      </AdminUnreadProvider>
    </MaintenanceProvider>
  );
}
