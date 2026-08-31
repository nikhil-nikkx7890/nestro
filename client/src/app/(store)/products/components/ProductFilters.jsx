"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { categoryService } from "@/services/category.service";
import { brandService } from "@/services/brand.service";
import { materialService } from "@/services/material.service";
import { colorService } from "@/services/color.service";

const selectClasses =
  "rounded-full border border-[#D8CDBB] bg-transparent px-4 py-2 text-sm text-[#2B2621] outline-none transition focus:border-[#B15E3B]";

export default function ProductFilters({ filters, onChange }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);

  // Same pattern ProductForm.jsx (admin) already uses to populate its
  // dropdowns — fetched once on mount, not tied to any form state.
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoryRes, brandRes, materialRes, colorRes] = await Promise.all([
          categoryService.list({ limit: 100, isActive: true }),
          brandService.list({ limit: 100, isActive: true }),
          materialService.list({ limit: 100, isActive: true }),
          colorService.list({ limit: 100, isActive: true }),
        ]);
        setCategories(categoryRes.data);
        setBrands(brandRes.data);
        setMaterials(materialRes.data);
        setColors(colorRes.data);
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };
    fetchOptions();
  }, []);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const update = (key, value) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="mb-10 flex flex-wrap items-center gap-3">
      <select
        value={filters.category || ""}
        onChange={(e) => update("category", e.target.value)}
        className={selectClasses}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={filters.brand || ""}
        onChange={(e) => update("brand", e.target.value)}
        className={selectClasses}
      >
        <option value="">All Brands</option>
        {brands.map((b) => (
          <option key={b._id} value={b._id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        value={filters.material || ""}
        onChange={(e) => update("material", e.target.value)}
        className={selectClasses}
      >
        <option value="">All Materials</option>
        {materials.map((m) => (
          <option key={m._id} value={m._id}>
            {m.name}
          </option>
        ))}
      </select>

      <select
        value={filters.color || ""}
        onChange={(e) => update("color", e.target.value)}
        className={selectClasses}
      >
        <option value="">All Colors</option>
        {colors.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="flex items-center gap-1 text-sm text-[#8A8071] transition hover:text-[#B15E3B]"
        >
          <X size={14} />
          Clear filters
        </button>
      )}
    </div>
  );
}
