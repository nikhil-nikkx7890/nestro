"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import clsx from "clsx";

import { authService } from "@/services/auth.service";
import { forgotPasswordSchema } from "./schemas/forgotPassword.schema";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Always the same generic message, whether or not this email has an
      // account (ADR-062) — there's nothing more specific to show here.
      const res = await authService.forgotPassword(data);
      toast.success(res.message);

      // Carried to the next step via sessionStorage, not a URL query
      // param — a reset flow shouldn't put an email address in browser
      // history or server access logs. Read by /verify-reset-otp.
      sessionStorage.setItem("passwordResetEmail", data.email);
      router.push("/verify-reset-otp");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enter your account email and we&apos;ll send you a 6-digit code.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Email
            </label>

            <input
              type="email"
              id="email"
              {...register("email")}
              placeholder="you@example.com"
              className={clsx(
                "w-full rounded-xl px-4 py-3 border outline-none transition",
                errors.email
                  ? "border-red-500"
                  : "border-neutral-300 focus:border-neutral-900",
              )}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-neutral-900 px-5 py-3 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending code..." : "Send Reset Code"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-neutral-900 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
