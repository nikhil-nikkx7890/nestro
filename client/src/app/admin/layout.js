"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the /me check (AuthContext) has actually resolved before
    // deciding to redirect — otherwise every page load would redirect a
    // genuinely logged-in user for the split second before we know that.
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  // Covers three states with one check: still checking (loading), no user
  // at all, or a logged-in user who isn't an admin (a customer account).
  // In all three, don't render the admin panel — either the redirect above
  // is about to fire, or is already in flight.
  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

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