"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  // Separate from `collapsed`: below lg the sidebar isn't a narrow rail,
  // it's an off-canvas drawer that's either over the page or off it.
  // A 256px sidebar on a 375px screen left ~85px for the actual content.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleSidebar}
        mobileNavOpen={mobileNavOpen}
        onCloseMobileNav={() => setMobileNavOpen(false)}
      />

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}