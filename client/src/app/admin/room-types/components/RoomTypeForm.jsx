"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomTypeSchema } from "../schemas/roomType.schema";
import ImageUpload from "@/components/ui/ImageUpload";

export default function RoomTypeForm({
  roomType,
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
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      name: "",
      image: { url: "", publicId: "" },
      isActive: true,
    },
  });

  useEffect(() => {
    reset({
      name: roomType?.name || "",
      image: roomType?.image || { url: "", publicId: "" },
      isActive: roomType?.isActive ?? true,
    });
  }, [roomType, reset]);

  const currentImage = watch("image");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* RoomType Name */}
      <div>
        <label
          htmlFor="room-type-name"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Room Type Name
        </label>

        <input
          type="text"
          id="room-type-name"
          {...register("name")}
          placeholder="Enter room type name"
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

      {/* Image */}
      <ImageUpload
        label="Room Type Image"
        folder="nestro/room-types"
        value={currentImage}
        onChange={(nextImage) =>
          setValue("image", nextImage, { shouldDirty: true })
        }
        onUploadingChange={setIsImageUploading}
      />

      {/* Active */}
      <label className="flex items-center gap-3">
        <input type="checkbox" {...register("isActive")} />

        <span className="text-sm font-medium">Active Room Type</span>
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
              : "Save Room Type"}
        </button>
      </div>
    </form>
  );
}
