"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import clsx from "clsx";

import { useRequireCustomer } from "@/hooks/useRequireCustomer";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import { addressService } from "@/services/address.service";
import { orderService } from "@/services/order.service";
import { formatPaise } from "@/utils/formatters";
import { profileSchema } from "./schemas/profile.schema";

export default function AccountPage() {
  const { ready } = useRequireCustomer();
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Not wired through AuthContext — resending doesn't change any user
  // state the rest of the app reads (isEmailVerified only flips once the
  // link is actually clicked, on a different page), so a direct service
  // call is the same "don't abstract until it fits" call the Contact
  // form already makes for its own stateless action.
  const [isResending, setIsResending] = useState(false);

  // Just a summary here (count + default) — the full list/add/edit/delete
  // UI lives on its own page (/account/addresses), the same "preview
  // block links out to the real page" shape as Order History below would
  // use once Orders exists.
  const [addresses, setAddresses] = useState(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await addressService.list();
      setAddresses(res.data);
    } catch (error) {
      // Silent — this is a summary card, not the primary content of the
      // page; the full addresses page surfaces its own errors properly.
    }
  }, []);

  // Category A (ADR-059): fetch-on-mount, same shape as CartContext's
  // own suppressed effect.
  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAddresses();
  }, [ready, fetchAddresses]);

  // Same summary-card shape as Addresses above — replaces the previous
  // honest "no orders yet" placeholder now that Orders (ADR-066) exists
  // to actually have real data. The full history lives on its own page
  // (/account/orders), same as Addresses.
  const [orders, setOrders] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.list();
      setOrders(res.data);
    } catch (error) {
      // Silent, same reasoning as fetchAddresses above — a summary card,
      // not the page's primary content.
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [ready, fetchOrders]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    reset({ name: user?.name || "" });
  }, [user, reset]);

  const defaultAddress = addresses?.find((a) => a.isDefault) || addresses?.[0] || null;

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-[#78716C] sm:px-10">
        Loading...
      </div>
    );
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await updateProfile(data);
      toast.success("Profile updated.");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update profile. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendVerification = async () => {
    setIsResending(true);
    try {
      const res = await authService.resendVerificationEmail();
      toast.success(res.message);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to send verification email. Please try again.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8B5E3C]">Account</p>
      <h1 className="mt-4 font-heading text-4xl text-[#1C1917]">Your Profile</h1>

      {/* Verify-but-don't-block (ADR-063): the account already works fully
          without this — the banner is a visible, actionable reminder, not
          a gate. Hidden entirely once isEmailVerified flips true. */}
      {user && !user.isEmailVerified && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-900">
              Please verify your email address
            </p>
            <p className="mt-1 text-sm text-amber-800">
              We sent a link to {user.email}{" "}
              when you registered. Didn&apos;t get it, or has it expired?
            </p>
          </div>
          <button
            type="button"
            onClick={onResendVerification}
            disabled={isResending}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-[#E7E5E4] p-6">
        <h2 className="font-heading text-xl text-[#1C1917]">Profile Details</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#1C1917]">
              Name
            </label>
            <input
              type="text"
              id="name"
              {...register("name")}
              className={clsx(
                "w-full rounded-xl border bg-white px-4 py-3 text-[#1C1917] outline-none transition",
                errors.name ? "border-red-400" : "border-[#D6D3D1] focus:border-[#8B5E3C]",
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#1C1917]">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-[#E7E5E4] bg-[#F5F5F4] px-4 py-3 text-[#78716C]"
            />
            <p className="mt-1 text-xs text-[#78716C]">Email can&apos;t be changed here.</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="rounded-lg bg-[#8B5E3C] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#6E4A2F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="mt-10 rounded-2xl border border-[#E7E5E4] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl text-[#1C1917]">Addresses</h2>
          <Link
            href="/account/addresses"
            className="text-sm font-medium text-[#8B5E3C] hover:underline"
          >
            Manage Addresses
          </Link>
        </div>

        {addresses === null ? (
          <p className="mt-3 text-sm text-[#78716C]">Loading...</p>
        ) : addresses.length === 0 ? (
          <p className="mt-3 text-sm text-[#78716C]">
            You haven&apos;t saved any addresses yet.
          </p>
        ) : (
          <p className="mt-3 text-sm text-[#44403C]">
            {addresses.length} saved {addresses.length === 1 ? "address" : "addresses"} —
            default: {defaultAddress.fullName}, {defaultAddress.city}, {defaultAddress.state}
          </p>
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-[#E7E5E4] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl text-[#1C1917]">Order History</h2>
          {orders && orders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-sm font-medium text-[#8B5E3C] hover:underline"
            >
              View All Orders
            </Link>
          )}
        </div>

        {orders === null ? (
          <p className="mt-3 text-sm text-[#78716C]">Loading...</p>
        ) : orders.length === 0 ? (
          <>
            <p className="mt-3 text-sm text-[#78716C]">
              You haven&apos;t placed any orders yet.
            </p>
            <Link
              href="/products"
              className="mt-3 inline-block text-sm font-medium text-[#8B5E3C] hover:underline"
            >
              Start shopping
            </Link>
          </>
        ) : (
          <p className="mt-3 text-sm text-[#44403C]">
            {orders.length} {orders.length === 1 ? "order" : "orders"} — most recent:{" "}
            {formatPaise(orders[0].total)} ({orders[0].status})
          </p>
        )}
      </div>
    </div>
  );
}
