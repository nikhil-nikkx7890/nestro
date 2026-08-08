"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { brandSchema } from "../schemas/brand.schema";

export default function BrandForm({ brand, onSubmit, onClose, isSubmitting }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      isActive: true,
    },
  });

  useEffect(() => {
    reset({
      name: brand?.name || "",
      isActive: brand?.isActive ?? true,
    });
  }, [brand, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Brand Name */}
      <div>
        <label
          htmlFor="brand-name"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Brand Name
        </label>

        <input
          type="text"
          id="brand-name"
          {...register("name")}
          placeholder="Enter brand name"
          className={clsx(
            "w-full rounded-xl border px-4 py-3 outline-none transition ",
            errors.name
              ? "border-red-500"
              : "border-neutral-300 focus:border-neutral-900",
          )}
        />

        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Active */}
      <label className="flex items-center gap-3">
        <input type="checkbox" {...register("isActive")} />

        <span className="text-sm font-medium">Active Brand</span>
      </label>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border px-5 py-2.5"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-neutral-900 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save Brand"}
        </button>
      </div>
    </form>
  );
}
