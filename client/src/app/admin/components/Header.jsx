"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";

export default function Header({ onOpenMobileNav }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/login");
  };

  // Falls back gracefully if this ever renders before `user` is set —
  // shouldn't happen in practice since the layout guard (admin/layout.js)
  // only renders this once `user` is confirmed, but avoids a crash if it did.
  const initial = user?.name?.charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Opens the off-canvas sidebar — below lg it's the only way to
          reach navigation, since the sidebar sits off-screen there. */}
      <button
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="-ml-2 rounded-xl p-2 transition hover:bg-neutral-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Search */}

      <div className="relative hidden w-full max-w-sm sm:block">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />

        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 focus:border-neutral-900 focus:bg-white"
        />
      </div>

      {/* Right */}

      <div className="ml-auto flex items-center gap-2 sm:gap-5">

        <button className="relative rounded-xl p-2 transition hover:bg-neutral-100">

          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>

        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-neutral-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 font-semibold text-white">
              {initial}
            </div>

            {/* Name/role drop away on small screens — the avatar alone
                identifies the account, and the row has to share a 375px
                header with the menu button and notifications. */}
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium">{user?.name}</p>

              <p className="text-xs capitalize text-neutral-500">
                {user?.role}
              </p>
            </div>

            <ChevronDown size={16} className="hidden text-neutral-500 sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-neutral-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
