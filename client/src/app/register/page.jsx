"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import clsx from "clsx";

import { useAuth } from "@/context/AuthContext";
import { registerSchema } from "./schemas/register.schema";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register: registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "admin" ? "/admin" : "/products");
    }
  }, [loading, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const newUser = await registerUser(data);
      toast.success(`Welcome, ${newUser.name}`);
      router.push("/products");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Join Nestro to shop, save favorites, and check out faster.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Name
            </label>

            <input
              type="text"
              id="name"
              {...register("name")}
              placeholder="Your name"
              className={clsx(
                "w-full rounded-xl px-4 py-3 border outline-none transition",
                errors.name
                  ? "border-red-500"
                  : "border-neutral-300 focus:border-neutral-900",
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

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
              placeholder="At least 8 characters"
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
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-neutral-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
