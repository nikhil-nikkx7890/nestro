"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";

import { variantSchema } from "../schemas/variant.schema";
import ImageUpload from "@/components/ui/ImageUpload";

import { materialService } from "@/services/material.service";
import { colorService } from "@/services/color.service";

export default function VariantForm({ variant, onSubmit, onClose, isSubmitting }) {
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isImageUploading, setIsImageUploading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [materialRes, colorRes] = await Promise.all([
          materialService.list({ limit: 100, isActive: true }),
          colorService.list({ limit: 100, isActive: true }),
        ]);
        setMaterials(materialRes.data);
        setColors(colorRes.data);
      } catch (err) {
        console.error("Failed to load dropdown options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      price: "",
      compareAtPrice: "",
      material: "",
      color: "",
      images: [],
      stock: 0,
      lowStockThreshold: 5,
      dimensions: { length: "", width: "", height: "", unit: "cm" },
      weight: { value: "", unit: "kg" },
      isActive: true,
    },
  });

  useEffect(() => {
    reset({
      price: variant?.price ?? "",
      compareAtPrice: variant?.compareAtPrice ?? "",
      material: variant?.material?._id || "",
      color: variant?.color?._id || "",
      images: variant?.images || [],
      stock: variant?.stock ?? 0,
      lowStockThreshold: variant?.lowStockThreshold ?? 5,
      dimensions: variant?.dimensions || {
        length: "",
        width: "",
        height: "",
        unit: "cm",
      },
      weight: variant?.weight || { value: "", unit: "kg" },
      isActive: variant?.isActive ?? true,
    });
  }, [variant, reset]);

  const currentImages = watch("images");

  const addImage = () => {
    setValue("images", [...currentImages, { url: "", publicId: "" }], {
      shouldDirty: true,
    });
  };
  const updateImage = (index, nextImage) => {
    const next = [...currentImages];
    next[index] = nextImage;
    setValue("images", next, { shouldDirty: true });
  };
  const removeImage = (index) => {
    setValue(
      "images",
      currentImages.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  const onFormSubmit = (data) => {
    const cleanedImages = data.images.filter((img) => img.publicId);
    onSubmit({ ...data, images: cleanedImages });
  };

  if (loadingOptions) {
    return <div className="p-6 text-center text-neutral-500">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      {/* SKU — auto-generated from product + material + color, not user-editable */}
      {variant?.sku && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            SKU
          </label>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-sm text-neutral-600">
            {variant.sku}
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Auto-generated. Changes if you change material or color.
          </p>
        </div>
      )}
      {!variant && (
        <p className="text-sm text-neutral-500">
          The SKU will be generated automatically from the product, material,
          and color once you save.
        </p>
      )}

      {/* Price + Compare-at */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Price (paise)
          </label>
          <input
            type="number"
            {...register("price")}
            placeholder="25000"
            className={clsx(
              "w-full rounded-xl border px-4 py-3 outline-none transition",
              errors.price
                ? "border-red-500"
                : "border-neutral-300 focus:border-neutral-900",
            )}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Compare-at Price (optional)
          </label>
          <input
            type="number"
            {...register("compareAtPrice")}
            placeholder="30000"
            className={clsx(
              "w-full rounded-xl border px-4 py-3 outline-none transition",
              errors.compareAtPrice
                ? "border-red-500"
                : "border-neutral-300 focus:border-neutral-900",
            )}
          />
          {errors.compareAtPrice && (
            <p className="mt-1 text-sm text-red-500">
              {errors.compareAtPrice.message}
            </p>
          )}
        </div>
      </div>

      {/* Material + Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Material
          </label>
          <select
            {...register("material")}
            className={clsx(
              "w-full rounded-xl border bg-white px-4 py-3 outline-none transition",
              errors.material
                ? "border-red-500"
                : "border-neutral-300 focus:border-neutral-900",
            )}
          >
            <option value="">Select material</option>
            {materials.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          {errors.material && (
            <p className="mt-1 text-sm text-red-500">
              {errors.material.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Color
          </label>
          <select
            {...register("color")}
            className={clsx(
              "w-full rounded-xl border bg-white px-4 py-3 outline-none transition",
              errors.color
                ? "border-red-500"
                : "border-neutral-300 focus:border-neutral-900",
            )}
          >
            <option value="">Select color</option>
            {colors.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.color && (
            <p className="mt-1 text-sm text-red-500">{errors.color.message}</p>
          )}
        </div>
      </div>

      {/* Stock + Low stock threshold */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Stock
          </label>
          <input
            type="number"
            {...register("stock")}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-900"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Low Stock Threshold
          </label>
          <input
            type="number"
            {...register("lowStockThreshold")}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-900"
          />
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Dimensions
        </label>
        <div className="grid grid-cols-4 gap-3">
          <input
            type="number"
            {...register("dimensions.length")}
            placeholder="Length"
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
          />
          <input
            type="number"
            {...register("dimensions.width")}
            placeholder="Width"
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
          />
          <input
            type="number"
            {...register("dimensions.height")}
            placeholder="Height"
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
          />
          <select
            {...register("dimensions.unit")}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
          >
            <option value="cm">cm</option>
            <option value="in">in</option>
          </select>
        </div>
      </div>

      {/* Weight */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Weight
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            {...register("weight.value")}
            placeholder="Weight"
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
          />
          <select
            {...register("weight.unit")}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Images (optional override)
        </label>
        <div className="flex flex-wrap gap-3">
          {currentImages.map((img, index) => (
            <div key={index} className="relative">
              <ImageUpload
                label=""
                folder="nestro/variants"
                value={img}
                onChange={(next) => updateImage(index, next)}
                onUploadingChange={setIsImageUploading}
              />
              {img.publicId && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -left-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow"
                  aria-label="Remove image slot"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {currentImages.length < 4 && (
            <button
              type="button"
              onClick={addImage}
              className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              <span className="text-xs font-medium">+ Add image</span>
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          {currentImages.length} / 4 images
        </p>
      </div>

      {/* Active */}
      <label className="flex items-center gap-3">
        <input type="checkbox" {...register("isActive")} />
        <span className="text-sm font-medium">Active (purchasable)</span>
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
              : "Save Variant"}
        </button>
      </div>
    </form>
  );
}
