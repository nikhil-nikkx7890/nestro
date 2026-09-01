"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import clsx from "clsx";

import { useAuth } from "@/context/AuthContext";
import { loginSchema } from "./schemas/login.schema";

// Admin lands in the admin panel; a customer (or anyone else) lands back
// on the storefront — this same page now serves both login flows.
const postLoginPath = (user) => (user?.role === "admin" ? "/admin" : "/products");

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already logged in (e.g. cookie still valid from an earlier session) and
  // landed on /login anyway — skip the form entirely.
  useEffect(() => {
    if (!loading && user) {
      router.replace(postLoginPath(user));
    }
  }, [loading, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in to your Nestro account.
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
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Password
            </label>

            <input
              type="password"
              id="password"
              {...register("password")}
              placeholder="••••••••"
              className={clsx(
                "w-full rounded-xl px-4 py-3 border outline-none transition",
                errors.password
                  ? "border-red-500"
                  : "border-neutral-300 focus:border-neutral-900",
              )}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
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
