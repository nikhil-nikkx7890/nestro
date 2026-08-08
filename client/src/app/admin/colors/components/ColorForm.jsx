"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { colorSchema } from "../schemas/color.schema";

export default function ColorForm({ color, onSubmit, onClose, isSubmitting }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      name: "",
      hexCode: "",
      isActive: true,
    },
  });

  useEffect(() => {
    reset({
      name: color?.name || "",
      hexCode: color?.hexCode || "",
      isActive: color?.isActive ?? true,
    });
  }, [color, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label
          htmlFor="color-name"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Color Name
        </label>

        <input
          type="text"
          id="color-name"
          {...register("name")}
          placeholder="Enter color name"
          className={clsx(
            "w-full rounded-xl border px-4 py-3 outline-none transition",
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
          htmlFor="color-hex"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Hex Code
        </label>

        <input
          type="text"
          id="color-hex"
          {...register("hexCode")}
          placeholder="#8B5E3C"
          className={clsx(
            "w-full rounded-xl border px-4 py-3 outline-none transition",
            errors.hexCode
              ? "border-red-500"
              : "border-neutral-300 focus:border-neutral-900",
          )}
        />

        {errors.hexCode && (
          <p className="mt-1 text-sm text-red-500">{errors.hexCode.message}</p>
        )}
      </div>

      <label className="flex items-center gap-3">
        <input type="checkbox" {...register("isActive")} />

        <span className="text-sm font-medium">Active Color</span>
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
          {isSubmitting ? "Saving..." : "Save Color"}
        </button>
      </div>
    </form>
  );
}
