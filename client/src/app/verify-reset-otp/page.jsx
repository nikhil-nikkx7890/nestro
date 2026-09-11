"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import clsx from "clsx";

import { authService } from "@/services/auth.service";
import { verifyResetOtpSchema } from "./schemas/verifyResetOtp.schema";

export default function VerifyResetOtpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read once on mount rather than via useSearchParams — the email lives
  // in sessionStorage, set by the forgot-password step (see that page's
  // comment for why it isn't in the URL). null while this effect hasn't
  // run yet; "" once it has and found nothing.
  const [email, setEmail] = useState(null);

  // Category A (ADR-059): sessionStorage is an external system this
  // component has to read on mount, the same shape as CartContext's
  // fetch-on-mount. It isn't available during SSR, so there's no
  // rule-clean way to get it into state before the first render.
  useEffect(() => {
    const stored = sessionStorage.getItem("passwordResetEmail");
    // Landed here without going through forgot-password first (direct
    // link, refresh after the flow already finished, back button after
    // clearing it) — there's no OTP to verify against, so send them to
    // start over rather than showing a form that can never succeed.
    if (!stored) {
      router.replace("/forgot-password");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(stored);
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyResetOtpSchema),
    defaultValues: { otp: "" },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const res = await authService.verifyResetOtp({ email, otp: data.otp });
      // The reset token, like the email above, is carried via
      // sessionStorage rather than a URL — a token in the URL risks
      // ending up in browser history or a proxy log.
      sessionStorage.setItem("passwordResetToken", res.data.resetToken);
      router.push("/reset-password");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Invalid or expired code. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Still checking sessionStorage / about to redirect — render nothing
  // rather than flash the form for a caller who has no email to verify.
  if (!email) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Enter your code</h1>
        <p className="mt-1 text-sm text-neutral-500">
          We sent a 6-digit code to <span className="font-medium text-neutral-900">{email}</span>.
          It expires in 15 minutes.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="otp"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              6-digit code
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              id="otp"
              maxLength={6}
              {...register("otp")}
              placeholder="123456"
              className={clsx(
                "w-full rounded-xl px-4 py-3 border text-center text-lg tracking-[0.3em] outline-none transition",
                errors.otp
                  ? "border-red-500"
                  : "border-neutral-300 focus:border-neutral-900",
              )}
            />
            {errors.otp && (
              <p className="mt-1 text-sm text-red-500">{errors.otp.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-neutral-900 px-5 py-3 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Didn&apos;t get a code?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-neutral-900 hover:underline"
          >
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}
