"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import clsx from "clsx";

import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import { loginSchema } from "./schemas/login.schema";
import { otpRequestSchema, otpVerifySchema } from "./schemas/otpLogin.schema";

// Admin lands in the admin panel; a customer (or anyone else) lands back
// on the storefront — this same page now serves both login flows.
const postLoginPath = (user) => (user?.role === "admin" ? "/admin" : "/products");

const inputClasses = (hasError) =>
  clsx(
    "w-full rounded-xl px-4 py-3 border outline-none transition",
    hasError ? "border-red-500" : "border-neutral-300 focus:border-neutral-900",
  );

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login, loginWithOtp } = useAuth();

  // "password" | "otp" — which tab is showing. Switching away from "otp"
  // resets its own sub-state below, so coming back always starts fresh
  // rather than reappearing mid-code-entry for a different email.
  const [mode, setMode] = useState("password");

  // OTP tab's own 2-step flow, entirely local to this page (ADR-064: no
  // intermediate token, no separate route — unlike password reset, there's
  // nothing here that needs to survive a navigation, so plain useState is
  // enough; no sessionStorage the way the reset-password pages need).
  const [otpStep, setOtpStep] = useState("request"); // "request" | "verify"
  const [otpEmail, setOtpEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already logged in (e.g. cookie still valid from an earlier session) and
  // landed on /login anyway — skip the form entirely.
  useEffect(() => {
    if (!loading && user) {
      router.replace(postLoginPath(user));
    }
  }, [loading, user, router]);

  const passwordForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const otpRequestForm = useForm({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { email: "" },
  });

  const otpVerifyForm = useForm({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { otp: "" },
  });

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setOtpStep("request");
    setOtpEmail("");
    otpRequestForm.reset({ email: "" });
    otpVerifyForm.reset({ otp: "" });
  };

  const onPasswordSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const user = await login(data);
      toast.success(`Welcome back, ${user.name}`);
      router.push(postLoginPath(user));
    } catch (error) {
      // Backend sends { success: false, message: "..." } on 401/403/429 —
      // errorHandler.js's shape, same one every other service call in this
      // app already relies on for its own error toasts.
      const message =
        error?.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 (ADR-064): generic response either way, so there's nothing
  // meaningful to branch on here — always advance to the code-entry step
  // and show the same message the backend actually sent.
  const onOtpRequestSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await authService.requestOtpLogin(data);
      toast.success(res.message);
      setOtpEmail(data.email);
      setOtpStep("verify");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 — verifying the code *is* signing in, no separate action after
  // (ADR-064), so this mirrors the password form's own submit handler.
  const onOtpVerifySubmit = async ({ otp }) => {
    setIsSubmitting(true);
    try {
      const user = await loginWithOtp({ email: otpEmail, otp });
      toast.success(`Welcome back, ${user.name}`);
      router.push(postLoginPath(user));
    } catch (error) {
      const message =
        error?.response?.data?.message || "Invalid or expired code. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    setIsSubmitting(true);
    try {
      const res = await authService.requestOtpLogin({ email: otpEmail });
      toast.success(res.message);
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
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in to your Nestro account.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-neutral-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => switchMode("password")}
            className={clsx(
              "rounded-lg py-2 transition",
              mode === "password"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => switchMode("otp")}
            className={clsx(
              "rounded-lg py-2 transition",
              mode === "otp"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            Email code
          </button>
        </div>

        {mode === "password" && (
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="mt-6 space-y-5"
          >
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
                {...passwordForm.register("email")}
                placeholder="you@example.com"
                className={inputClasses(!!passwordForm.formState.errors.email)}
              />
              {passwordForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {passwordForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                type="password"
                id="password"
                {...passwordForm.register("password")}
                placeholder="••••••••"
                className={inputClasses(!!passwordForm.formState.errors.password)}
              />
              {passwordForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-neutral-900 px-5 py-3 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {mode === "otp" && otpStep === "request" && (
          <form
            onSubmit={otpRequestForm.handleSubmit(onOtpRequestSubmit)}
            className="mt-6 space-y-5"
          >
            <p className="text-sm text-neutral-500">
              We&apos;ll email you a 6-digit code — no password needed.
            </p>

            <div>
              <label
                htmlFor="otp-email"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Email
              </label>

              <input
                type="email"
                id="otp-email"
                {...otpRequestForm.register("email")}
                placeholder="you@example.com"
                className={inputClasses(!!otpRequestForm.formState.errors.email)}
              />
              {otpRequestForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {otpRequestForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-neutral-900 px-5 py-3 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending code..." : "Send Code"}
            </button>
          </form>
        )}

        {mode === "otp" && otpStep === "verify" && (
          <form
            onSubmit={otpVerifyForm.handleSubmit(onOtpVerifySubmit)}
            className="mt-6 space-y-5"
          >
            <p className="text-sm text-neutral-500">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-neutral-900">{otpEmail}</span>. It expires
              in 5 minutes.
            </p>

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
                {...otpVerifyForm.register("otp")}
                placeholder="123456"
                className={clsx(
                  inputClasses(!!otpVerifyForm.formState.errors.otp),
                  "text-center text-lg tracking-[0.3em]",
                )}
              />
              {otpVerifyForm.formState.errors.otp && (
                <p className="mt-1 text-sm text-red-500">
                  {otpVerifyForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-neutral-900 px-5 py-3 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify & Sign In"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setOtpStep("request")}
                className="font-medium text-neutral-500 hover:text-neutral-900 hover:underline"
              >
                Use a different email
              </button>
              <button
                type="button"
                onClick={onResendOtp}
                disabled={isSubmitting}
                className="font-medium text-neutral-500 hover:text-neutral-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500">
          New here?{" "}
          <Link href="/register" className="font-medium text-neutral-900 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
