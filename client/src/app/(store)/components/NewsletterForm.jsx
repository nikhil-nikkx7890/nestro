"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { newsletterService } from "@/services/newsletter.service";

// Mirrors the backend's newsletter.validator.js — same shared
// validation pattern the rest of the app already uses (RHF + Zod on the
// client, Zod again on the server; the client copy is for UX, the server
// copy is the real gate).
const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export default function NewsletterForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async ({ email }) => {
    try {
      const response = await newsletterService.subscribe(email);
      toast.success(response.message);
      reset();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't subscribe. Try again.");
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#D6BFA7]">
          Stay in the loop
        </p>
        <p className="mt-2 font-heading text-xl text-white">
          New arrivals and design notes
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-md"
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Your email address"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
              className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none transition focus:border-[#D6BFA7]"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#8B5E3C] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#6E4A2F] disabled:opacity-50"
          >
            {isSubmitting ? "..." : "Subscribe"}
          </button>
        </div>
        {errors.email && (
          <p className="mt-2 text-xs text-red-400">{errors.email.message}</p>
        )}
      </form>
    </div>
  );
}
