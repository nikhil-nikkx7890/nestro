"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import clsx from "clsx";

import { contactService } from "@/services/contact.service";
import { contactSchema } from "./schemas/contact.schema";

const inputClasses = (hasError) =>
  clsx(
    "w-full rounded-xl border bg-white px-4 py-3 text-[#1C1917] outline-none transition",
    hasError ? "border-red-400" : "border-[#D6D3D1] focus:border-[#8B5E3C]",
  );

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await contactService.submit(data);
      toast.success("Message sent — we'll get back to you soon.");
      reset();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to send your message. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:px-10 sm:py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8B5E3C]">Contact</p>
      <h1 className="mt-4 font-heading text-4xl text-[#1C1917]">Get in Touch</h1>
      <p className="mt-3 max-w-xl text-[#57534E]">
        Questions about a product, an order, or anything else — send us a
        message and we&apos;ll reply as soon as we can.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-start gap-3">
            <Mail size={20} className="mt-0.5 text-[#8B5E3C]" />
            <div>
              <p className="font-medium text-[#1C1917]">Email</p>
              <a
                href="mailto:nikkxtechnologies@gmail.com"
                className="text-sm text-[#57534E] hover:text-[#8B5E3C]"
              >
                nikkxtechnologies@gmail.com
              </a>
            </div>
          </div>
          <p className="mt-6 text-sm text-[#78716C]">
            We typically respond within 1–2 business days.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 lg:col-span-3"
        >
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#1C1917]">
              Name
            </label>
            <input
              type="text"
              id="name"
              {...register("name")}
              placeholder="Your name"
              className={inputClasses(errors.name)}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#1C1917]">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register("email")}
              placeholder="you@example.com"
              className={inputClasses(errors.email)}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-medium text-[#1C1917]">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              {...register("message")}
              placeholder="How can we help?"
              className={inputClasses(errors.message)}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#8B5E3C] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#6E4A2F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
