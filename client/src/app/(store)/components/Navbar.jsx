"use client";

import Link from "next/link";
import { User } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-[#E7DFD3]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link
          href="/products"
          className="font-heading text-2xl font-semibold tracking-tight text-[#2B2621]"
        >
          Nestro
        </Link>

        <nav className="flex items-center gap-8">
          <Link
            href="/products"
            className="text-sm font-medium text-[#5A5147] transition hover:text-[#B15E3B]"
          >
            Shop
          </Link>

          {!loading && user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-medium text-[#5A5147] transition hover:text-[#B15E3B]"
            >
              <User size={18} />
              <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
            </Link>
          )}

          {/* A logged-in customer has no account page yet — only Login/Logout
              are meaningful before Cart/Wishlist (ADR-037) exist, and Logout
              already lives on the admin Header. Just show a Login link. */}
          {!loading && !user && (
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-[#5A5147] transition hover:text-[#B15E3B]"
            >
              <User size={18} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
