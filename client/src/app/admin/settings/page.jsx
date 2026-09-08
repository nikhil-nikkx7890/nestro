"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { userService } from "@/services/user.service";

/**
 * Deliberately narrow. This page contains only settings that actually do
 * something and facts that are actually read from somewhere — no store
 * name / currency / tax-rate form saving to nowhere.
 *
 * That's ADR-055's rule applied at build time rather than cleaned up
 * later: a settings screen full of controls that silently discard input
 * is the same problem as a dashboard full of invented numbers. Real
 * store configuration arrives with Commerce, when something exists that
 * would actually consume it.
 */
const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name cannot exceed 50 characters."),
});

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-3 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user, updateProfile } = useAuth();
  const [counts, setCounts] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "" },
  });

  // The form mounts before AuthContext's /me check necessarily resolves,
  // so seed it once the user actually arrives.
  useEffect(() => {
    if (user?.name) reset({ name: user.name });
  }, [user?.name, reset]);

  useEffect(() => {
    const load = async () => {
      try {
        const [products, categories, users] = await Promise.all([
          productService.list({ limit: 1 }),
          categoryService.list({ limit: 1 }),
          userService.list({ limit: 1 }),
        ]);
        setCounts({
          products: products.pagination?.total ?? 0,
          categories: categories.pagination?.total ?? 0,
          users: users.pagination?.total ?? 0,
        });
      } catch (err) {
        console.error("Failed to load system info:", err);
      }
    };
    load();
  }, []);

  const onSubmit = async ({ name }) => {
    try {
      await updateProfile({ name });
      toast.success("Profile updated");
      reset({ name });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't update your profile.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>

        <p className="mt-2 text-neutral-500">
          Your account, and what this deployment is currently running.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          title="Your Account"
          description="The only field the API lets an account change about itself."
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-500">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="mt-2 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2.5 text-sm text-neutral-500"
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                Changing an email needs verification, which arrives with email
                infrastructure.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </form>
        </Section>

        <Section
          title="System"
          description="Read from the running application, not hardcoded."
        >
          <div>
            <InfoRow label="Signed in as" value={user?.email || "—"} />
            <InfoRow label="Role" value={user?.role || "—"} />
            <InfoRow
              label="API base URL"
              value={process.env.NEXT_PUBLIC_API_URL || "not set"}
            />
            <InfoRow label="Products" value={counts ? counts.products : "—"} />
            <InfoRow label="Categories" value={counts ? counts.categories : "—"} />
            <InfoRow label="Registered accounts" value={counts ? counts.users : "—"} />
          </div>
        </Section>
      </div>

      <Section
        title="Not configurable yet"
        description="Listed so it's clear these are unbuilt, not hidden."
      >
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>
            <span className="font-medium">Store details, currency, tax and shipping</span>{" "}
            — nothing consumes these until Checkout exists, so there’s no
            settings store to write them to.
          </li>
          <li>
            <span className="font-medium">Password change and reset</span> — needs email
            infrastructure, which the project doesn’t have yet.
          </li>
          <li>
            <span className="font-medium">Role management</span> — promoting an account to
            admin is Super Admin territory, deliberately deferred until there’s a
            real second-admin scenario.
          </li>
        </ul>
      </Section>
    </div>
  );
}
