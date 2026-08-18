import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { RoleSwitcherBanner } from './RoleSwitcherBanner';

export const AppShell: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeMobileSidebar} />
      )}

      <Sidebar isOpen={isMobileSidebarOpen} onClose={closeMobileSidebar} />

      <div className="app-main-wrapper">
        <RoleSwitcherBanner />
        <Navbar onToggleSidebar={toggleMobileSidebar} />
        <main className="app-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
