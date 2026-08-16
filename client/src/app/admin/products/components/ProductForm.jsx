"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import clsx from "clsx";

import { productSchema } from "../schemas/product.schema";
import ImageUpload from "@/components/ui/ImageUpload";

import { categoryService } from "@/services/category.service";
import { brandService } from "@/services/brand.service";
import { roomTypeService } from "@/services/roomType.service";

export default function ProductForm({ product, onSubmit, onCancel, isSubmitting }) {
  const isEditMode = Boolean(product);
  const [isImageUploading, setIsImageUploading] = useState(false);
  // Dropdown option lists — fetched once on mount, not tied to react-hook-form
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoryRes, brandRes, roomTypeRes] = await Promise.all([
          categoryService.list({ limit: 100, isActive: true }),
          brandService.list({ limit: 100, isActive: true }),
          roomTypeService.list({ limit: 100, isActive: true }),
        ]);
        setCategories(categoryRes.data);
        setBrands(brandRes.data);
        setRoomTypes(roomTypeRes.data);
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
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      brand: "",
      roomTypes: [],
      images: [],
      specifications: [],
      seo: { title: "", description: "" },
      status: "draft",
    },
  });

  useEffect(() => {
    if (!product) return;
    reset({
      name: product.name || "",
      description: product.description || "",
      category: product.category?._id || "",
      brand: product.brand?._id || "",
      roomTypes: product.roomTypes?.map((rt) => rt._id) || [],
      images: product.images || [],
      specifications: product.specifications || [],
      seo: product.seo || { title: "", description: "" },
      status: product.status || "draft",
    });
  }, [product, reset]);

  const currentImages = watch("images");
  const currentRoomTypes = watch("roomTypes");
  const currentSpecs = watch("specifications");

  const toggleRoomType = (id) => {
    const next = currentRoomTypes.includes(id)
      ? currentRoomTypes.filter((rtId) => rtId !== id)
      : [...currentRoomTypes, id];
    setValue("roomTypes", next, { shouldValidate: true, shouldDirty: true });
  };

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

  const addSpec = () => {
    setValue(
      "specifications",
      [...currentSpecs, { key: "", value: "" }],
      { shouldDirty: true },
    );
  };
  const updateSpec = (index, field, value) => {
    const next = [...currentSpecs];
    next[index] = { ...next[index], [field]: value };
    setValue("specifications", next, { shouldDirty: true });
  };
  const removeSpec = (index) => {
    setValue(
      "specifications",
      currentSpecs.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  const onFormSubmit = (data) => {
    // Drop any image slots the user added but never actually uploaded
    // into — an empty {url: "", publicId: ""} object has no business
    // being saved to the product.
    const cleanedImages = data.images.filter((img) => img.publicId);
    onSubmit({ ...data, images: cleanedImages });
  };

  if (loadingOptions) {
    return <div className="p-10 text-center text-neutral-500">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Product Name
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="Enter product name"
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

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Description
        </label>
        <textarea
          rows={4}
          {...register("description")}
          placeholder="Enter description"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-900"
        />
      </div>

      {/* Category + Brand */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Category
          </label>
          <select
            {...register("category")}
            className={clsx(
              "w-full rounded-xl border bg-white px-4 py-3 outline-none transition",
              errors.category
                ? "border-red-500"
                : "border-neutral-300 focus:border-neutral-900",
            )}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Brand
          </label>
          <select
            {...register("brand")}
            className={clsx(
              "w-full rounded-xl border bg-white px-4 py-3 outline-none transition",
              errors.brand
                ? "border-red-500"
                : "border-neutral-300 focus:border-neutral-900",
            )}
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
          {errors.brand && (
            <p className="mt-1 text-sm text-red-500">{errors.brand.message}</p>
          )}
        </div>
      </div>

      {/* Room Types — multi-select via toggle chips */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Room Types
        </label>
        <div className="flex flex-wrap gap-2">
          {roomTypes.map((rt) => {
            const selected = currentRoomTypes.includes(rt._id);
            return (
              <button
                key={rt._id}
                type="button"
                onClick={() => toggleRoomType(rt._id)}
                className={clsx(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  selected
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-600 hover:border-neutral-400",
                )}
              >
                {rt.name}
              </button>
            );
          })}
        </div>
        {errors.roomTypes && (
          <p className="mt-1 text-sm text-red-500">
            {errors.roomTypes.message}
          </p>
        )}
      </div>

      {/* Images gallery */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Images
        </label>
        <div className="flex flex-wrap gap-4">
          {currentImages.map((img, index) => (
            <div key={index} className="relative">
              <ImageUpload
                label=""
                folder="nestro/products"
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
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImage}
            className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            <Plus size={22} />
            <span className="text-xs font-medium">Add image slot</span>
          </button>
        </div>
      </div>

      {/* Specifications */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Specifications
        </label>
        <div className="space-y-3">
          {currentSpecs.map((spec, index) => (
            <div key={index} className="flex gap-3">
              <input
                type="text"
                placeholder="Key (e.g. Frame Material)"
                value={spec.key}
                onChange={(e) => updateSpec(index, "key", e.target.value)}
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-neutral-900"
              />
              <input
                type="text"
                placeholder="Value (e.g. Sheesham Wood)"
                value={spec.value}
                onChange={(e) => updateSpec(index, "value", e.target.value)}
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-neutral-900"
              />
              <button
                type="button"
                onClick={() => removeSpec(index)}
                className="rounded-lg p-2.5 text-red-600 transition hover:bg-red-50"
                aria-label="Remove specification"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSpec}
            className="flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            <Plus size={16} />
            Add specification
          </button>
        </div>
        {errors.specifications && (
          <p className="mt-1 text-sm text-red-500">
            Every specification needs both a key and a value — remove any
            empty rows or fill them in.
          </p>
        )}
      </div>

      {/* SEO */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            SEO Title
          </label>
          <input
            type="text"
            {...register("seo.title")}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-900"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            SEO Description
          </label>
          <input
            type="text"
            {...register("seo.description")}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-900"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Status
        </label>
        <select
          {...register("status")}
          className="w-full max-w-xs rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-neutral-900 sm:w-auto"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isImageUploading}
          className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isImageUploading
            ? "Uploading image..."
            : isSubmitting
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Save & Continue to Variants"}
        </button>
      </div>
    </form>
  );
}
