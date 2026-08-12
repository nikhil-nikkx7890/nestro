"use client";

export default function StatusFilter({ isActive, onChange }) {
  return (
    <select
      value={isActive}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
    >
      <option value="">All Status</option>
      <option value="true">Active</option>
      <option value="false">Inactive</option>
    </select>
  );
}
