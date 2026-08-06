"use client";

import { useEffect, useState } from "react";

export default function MaterialForm({
    material,
    onSubmit,
    onClose,
    isSubmitting,
}) {
    const [formData, setFormData] = useState({
        name: material?.name || "",
        isActive: material?.isActive ?? true,
    });

    useEffect(() => {
        setFormData({
            name: material?.name || "",
            isActive: material?.isActive ?? true,
        });
    }, [material]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Material Name
                </label>

                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter material name"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-900"
                />
            </div>

            <label className="flex items-center gap-3">
                <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                />

                <span className="text-sm font-medium">
                    Active Material
                </span>
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
                    className="rounded-xl bg-neutral-900 px-5 py-2.5 text-white"
                >
                    {isSubmitting ? "Saving..." : "Save Material"}
                </button>
            </div>
        </form>
    );
}