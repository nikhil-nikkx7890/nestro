"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

import { uploadImage } from "@/services/upload.service";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Reusable image upload field. Not tied to any single module — pass a
 * Cloudinary `folder` and wire `value`/`onChange` like any controlled
 * form field.
 *
 * value:    { url: string, publicId: string } | null
 * onChange: (nextValue) => void — called with the new image object,
 *           or { url: "", publicId: "" } when removed
 * onUploadingChange: (isUploading: boolean) => void — optional, lets the
 *           parent form disable Save while an upload is in progress
 */

export default function ImageUpload({
  value,
  onChange,
  onUploadingChange,
  folder,
  label = "Image",
}) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentUrl = value?.url || "";

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const uploaded = await uploadImage(file, folder);
      onChange(uploaded);
      toast.success("Image uploaded.");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      // Reset the input so selecting the same file again still fires onChange
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange({ url: "", publicId: "" });
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </label>

      {currentUrl ? (
        <div className="relative w-40">
          <img
            src={currentUrl}
            alt="Uploaded preview"
            className="h-40 w-40 rounded-xl border border-neutral-300 object-cover"
          />

          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove image"
            className="absolute -right-2 -top-2 rounded-full bg-neutral-900 p-1 text-white shadow"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={clsx(
            "flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900",
            isUploading && "cursor-not-allowed opacity-60",
          )}
        >
          {isUploading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <ImagePlus size={22} />
          )}
          <span className="text-xs font-medium">
            {isUploading ? "Uploading..." : "Upload image"}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
