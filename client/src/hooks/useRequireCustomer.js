"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

/**
 * Same guard pattern as admin/layout.js, generalized to the Customer role
 * — used by the Cart and Wishlist pages, both Customer-only per ADR-037.
 * Redirects to /login unless a logged-in Customer is confirmed; returns
 * `ready: false` while that's still being sorted out (still loading, no
 * user, or a logged-in Admin) so the caller can render a loading state
 * instead of a flash of the real page.
 */
export function useRequireCustomer() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "customer")) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const ready = !loading && !!user && user.role === "customer";

  return { ready };
}
