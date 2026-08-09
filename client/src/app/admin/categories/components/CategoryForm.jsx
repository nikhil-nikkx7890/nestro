"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";

import { categorySchema } from "../schemas/category.schema";
import ImageUpload from "@/components/ui/ImageUpload";

export default function CategoryForm({
  category,
  onSubmit,
  onClose,
  isSubmitting,
}) {
  const [isImageUploading, setIsImageUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      image: { url: "", publicId: "" },
      isActive: true,
    },
  });

  useEffect(() => {
    reset({
      name: category?.name || "",
      description: category?.description || "",
      image: category?.image || { url: "", publicId: "" },
      isActive: category?.isActive ?? true,
    });
  }, [category, reset]);

  // image isn't a native input, so react-hook-form can't track it via
  // register(). watch() reads its current value out of RHF's state so we
  // can pass it down as a controlled prop, and setValue() is how
  // ImageUpload writes back into that same state on upload/remove.
  const currentImage = watch("image");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Category Name */}
      <div>
        <label
          htmlFor="category-name"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Category Name
        </label>

        <input
          type="text"
          id="category-name"
          {...register("name")}
          placeholder="Enter category name"
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

      {/* Description */}
      <div>
        <label
          htmlFor="category-description"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Description
        </label>

        <textarea
          id="category-description"
          rows={4}
          {...register("description")}
          placeholder="Enter description"
          className={clsx(
            "w-full rounded-xl px-4 py-3 border outline-none transition",
            errors.description
              ? "border-red-500"
              : "border-neutral-300 focus:border-neutral-900",
          )}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Image */}
      <ImageUpload
        label="Category Image"
        folder="nestro/categories"
        value={currentImage}
        onChange={(nextImage) =>
          setValue("image", nextImage, { shouldDirty: true })
        }
        onUploadingChange={setIsImageUploading}
      />

      {/* Active */}
      <label className="flex items-center gap-3">
        <input type="checkbox" {...register("isActive")} />

        <span className="text-sm font-medium">Active Category</span>
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
          disabled={isSubmitting || isImageUploading}
          className="rounded-xl bg-neutral-900 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isImageUploading
            ? "Uploading image..."
            : isSubmitting
              ? "Saving..."
              : "Save Category"}
        </button>
      </div>
    </form>
  );
}