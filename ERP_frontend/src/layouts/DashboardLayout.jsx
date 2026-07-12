import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import MobileSidebar from "../components/layout/MobileSidebar";
import Sidebar from "../components/layout/Sidebar";
import CommandPalette from "../components/layout/CommandPalette";
import AICopilot from "../components/layout/AICopilot";

export default function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  return <div className="dashboard-layout">
    <div className={`desktop-sidebar ${isCollapsed ? "is-collapsed" : ""}`}>
      <Sidebar collapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed((value) => !value)} />
    </div>
    <div className="dashboard-content">
      <Header onMenuClick={() => setIsOpen(true)} />
      <main>
        <Outlet />
      </main>
    </div>
    <MobileSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    <CommandPalette />
    <AICopilot />
  </div>;
}
