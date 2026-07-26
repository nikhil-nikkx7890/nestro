"use client";

import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleSidebar}
      />

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <Header collapsed={collapsed} />

        <main className="flex-1 overflow-y-auto p-8 bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}