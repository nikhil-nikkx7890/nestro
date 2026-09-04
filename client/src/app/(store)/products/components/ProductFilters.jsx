"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { productService } from "@/services/product.service";

// ADR-048 — full match to the reference sidebar: checkboxes with live
// (published-only, static — not recomputed per active filter combination)
// counts, color swatches, and a price range. filters/onChange use arrays
// for every multi-select field; minPrice/maxPrice are paise (ADR-023),
// converted to/from rupees only at the input boundary in this component.
const toRupees = (paise) => (paise ? String(Math.round(Number(paise) / 100)) : "");
const toPaise = (rupees) => (rupees ? String(Math.round(Number(rupees) * 100)) : undefined);

function FilterSection({ title, children, defaultOpen = true, scrollable = false }) {
  return (
    <details className="border-b border-[#E7E5E4] py-4" open={defaultOpen}>
      <summary className="cursor-pointer list-none text-sm font-semibold text-[#1C1917]">
        {title}
      </summary>
      <div className={`mt-3 space-y-2 ${scrollable ? "max-h-48 overflow-y-auto pr-1" : ""}`}>
        {children}
      </div>
    </details>
  );
}

function CheckboxOption({ checked, onToggle, label, count }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-[#57534E] transition hover:text-[#1C1917]">
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 rounded border-[#D6D3D1] text-[#8B5E3C] accent-[#8B5E3C]"
        />
        {label}
      </span>
      <span className="text-xs text-[#A8A29E]">{count}</span>
    </label>
  );
}

export default function ProductFilters({ filters, onChange }) {
  const [options, setOptions] = useState(null);
  const [priceInputs, setPriceInputs] = useState({
    min: toRupees(filters.minPrice),
    max: toRupees(filters.maxPrice),
  });

  useEffect(() => {
    productService
      .getFilterOptions()
      .then((res) => setOptions(res.data))
      .catch((err) => console.error("Failed to load filter options:", err));
  }, []);

  // Keep the price inputs in sync if filters are cleared elsewhere (e.g.
  // "Clear all") without fighting the user's own typing otherwise.
  useEffect(() => {
    if (!filters.minPrice && !filters.maxPrice) {
      setPriceInputs({ min: "", max: "" });
    }
  }, [filters.minPrice, filters.maxPrice]);

  const hasActiveFilters =
    (filters.category?.length ?? 0) > 0 ||
    (filters.brand?.length ?? 0) > 0 ||
    (filters.roomType?.length ?? 0) > 0 ||
    (filters.material?.length ?? 0) > 0 ||
    (filters.color?.length ?? 0) > 0 ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.inStock);

  const toggleValue = (key, id) => {
    const current = filters[key] ?? [];
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
    onChange({ ...filters, [key]: next.length ? next : undefined });
  };

  const applyPriceRange = () => {
    onChange({
      ...filters,
      minPrice: toPaise(priceInputs.min),
      maxPrice: toPaise(priceInputs.max),
    });
  };

  const clearAll = () => {
    onChange({});
    setPriceInputs({ min: "", max: "" });
  };

  if (!options) {
    return <aside className="text-sm text-[#78716C]">Loading filters...</aside>;
  }

  return (
    <aside>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B5E3C]">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-[#78716C] transition hover:text-[#8B5E3C]"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      <FilterSection title="Category" scrollable>
        {options.categories.map((c) => (
          <CheckboxOption
            key={c._id}
            checked={(filters.category ?? []).includes(c._id)}
            onToggle={() => toggleValue("category", c._id)}
            label={c.name}
            count={c.count}
          />
        ))}
      </FilterSection>

      <FilterSection title="Room Type" scrollable>
        {options.roomTypes.map((r) => (
          <CheckboxOption
            key={r._id}
            checked={(filters.roomType ?? []).includes(r._id)}
            onToggle={() => toggleValue("roomType", r._id)}
            label={r.name}
            count={r.count}
          />
        ))}
      </FilterSection>

      <FilterSection title="Brand" defaultOpen={false} scrollable>
        {options.brands.map((b) => (
          <CheckboxOption
            key={b._id}
            checked={(filters.brand ?? []).includes(b._id)}
            onToggle={() => toggleValue("brand", b._id)}
            label={b.name}
            count={b.count}
          />
        ))}
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="₹0"
            value={priceInputs.min}
            onChange={(e) => setPriceInputs((p) => ({ ...p, min: e.target.value }))}
            onBlur={applyPriceRange}
            onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
            className="w-full rounded-lg border border-[#D6D3D1] bg-transparent px-3 py-1.5 text-sm text-[#1C1917] outline-none focus:border-[#8B5E3C]"
          />
          <span className="text-[#A8A29E]">—</span>
          <input
            type="number"
            min="0"
            placeholder="Any"
            value={priceInputs.max}
            onChange={(e) => setPriceInputs((p) => ({ ...p, max: e.target.value }))}
            onBlur={applyPriceRange}
            onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
            className="w-full rounded-lg border border-[#D6D3D1] bg-transparent px-3 py-1.5 text-sm text-[#1C1917] outline-none focus:border-[#8B5E3C]"
          />
        </div>
      </FilterSection>

      <FilterSection title="Material" scrollable>
        {options.materials.map((m) => (
          <CheckboxOption
            key={m._id}
            checked={(filters.material ?? []).includes(m._id)}
            onToggle={() => toggleValue("material", m._id)}
            label={m.name}
            count={m.count}
          />
        ))}
      </FilterSection>

      <FilterSection title="Color">
        <div className="flex flex-wrap gap-3 pt-1">
          {options.colors.map((c) => {
            const isSelected = (filters.color ?? []).includes(c._id);
            return (
              <button
                key={c._id}
                type="button"
                title={`${c.name} (${c.count})`}
                onClick={() => toggleValue("color", c._id)}
                style={{ backgroundColor: c.hexCode }}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  isSelected ? "border-[#8B5E3C] ring-2 ring-[#8B5E3C]/30" : "border-[#E7E5E4]"
                }`}
              />
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#57534E] transition hover:text-[#1C1917]">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={() =>
              onChange({ ...filters, inStock: filters.inStock ? undefined : true })
            }
            className="h-4 w-4 rounded border-[#D6D3D1] text-[#8B5E3C] accent-[#8B5E3C]"
          />
          In Stock Only
        </label>
      </FilterSection>
    </aside>
  );
}
