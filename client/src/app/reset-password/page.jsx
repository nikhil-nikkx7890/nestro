"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import clsx from "clsx";

import { useAuth } from "@/context/AuthContext";
import { resetPasswordSchema } from "./schemas/resetPassword.schema";

// Same branch login/page.jsx uses after a successful sign-in — a
// successful reset logs the user straight in (see AuthContext.resetPassword),
// so it lands them in the same place a normal login would.
const postResetPath = (user) => (user?.role === "admin" ? "/admin" : "/products");

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The reset token lives in sessionStorage, set by the verify-otp step —
  // see that page's comment for why it isn't a URL query param.
  const [resetToken, setResetToken] = useState(null);

  // Category A (ADR-059): same reasoning as verify-reset-otp's page —
  // reading an external system (sessionStorage) on mount, no rule-clean
  // alternative without SSR access to browser storage.
  useEffect(() => {
    const stored = sessionStorage.getItem("passwordResetToken");
    // No token means this step was reached out of sequence (direct link,
    // refresh after the flow already finished) — there's nothing to
    // reset against, so send them back to the start.
    if (!stored) {
      router.replace("/forgot-password");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResetToken(stored);
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async ({ newPassword }) => {
    setIsSubmitting(true);

    try {
      const user = await resetPassword({ resetToken, newPassword });

      // Single-use in practice: the token stays technically valid for
      // its own 10-minute window, but the password it was scoped to is
      // already changed, so clearing it here just tidies up rather than
      // being the thing that actually blocks reuse.
      sessionStorage.removeItem("passwordResetEmail");
      sessionStorage.removeItem("passwordResetToken");

      toast.success(`Password reset. Welcome back, ${user.name}.`);
      router.push(postResetPath(user));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "This reset link has expired or is invalid. Please start over.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!resetToken) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              New password
            </label>

            <input
              type="password"
              id="newPassword"
              {...register("newPassword")}
              placeholder="At least 8 characters"
              className={clsx(
                "w-full rounded-xl px-4 py-3 border outline-none transition",
                errors.newPassword
                  ? "border-red-500"
                  : "border-neutral-300 focus:border-neutral-900",
              )}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Confirm new password
            </label>

            <input
              type="password"
              id="confirmPassword"
              {...register("confirmPassword")}
              placeholder="Re-enter your new password"
              className={clsx(
                "w-full rounded-xl px-4 py-3 border outline-none transition",
                errors.confirmPassword
                  ? "border-red-500"
                  : "border-neutral-300 focus:border-neutral-900",
              )}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-neutral-900 px-5 py-3 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
