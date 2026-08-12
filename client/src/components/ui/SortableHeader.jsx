"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export default function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className = "",
}) {
  const isActive = sortBy === field;

  return (
    <th
      onClick={() => onSort(field)}
      className={`cursor-pointer select-none px-6 py-4 text-sm font-semibold transition hover:bg-neutral-100 ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {isActive ? (
          sortOrder === "asc" ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )
        ) : (
          <ChevronsUpDown size={14} className="text-neutral-300" />
        )}
      </div>
    </th>
  );
}
