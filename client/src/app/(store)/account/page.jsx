"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import clsx from "clsx";

import { useRequireCustomer } from "@/hooks/useRequireCustomer";
import { useAuth } from "@/context/AuthContext";
import { profileSchema } from "./schemas/profile.schema";

export default function AccountPage() {
  const { ready } = useRequireCustomer();
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8B5E3C]">Account</p>
      <h1 className="mt-4 font-heading text-4xl text-[#1C1917]">Your Profile</h1>

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
        <h2 className="font-heading text-xl text-[#1C1917]">Order History</h2>
        <p className="mt-3 text-sm text-[#78716C]">
          You haven&apos;t placed any orders yet.
        </p>
      </div>
    </div>
  );
}
