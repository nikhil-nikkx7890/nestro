import { Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";

const formatPaise = (paise) => `₹${(paise / 100).toLocaleString("en-IN")}`;

export default function VariantRow({ variant, onEdit, onDelete }) {
  const isLowStock =
    variant.stock > 0 && variant.stock <= variant.lowStockThreshold;
  const isOutOfStock = variant.stock === 0;

  return (
    <tr className="border-b border-neutral-100 transition hover:bg-neutral-50">
      <td className="px-6 py-4 font-medium">{variant.sku}</td>

      <td className="px-6 py-4 text-neutral-500">
        {variant.material?.name ?? "—"}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {variant.color?.hexCode && (
            <span
              className="h-4 w-4 rounded-full border border-neutral-200"
              style={{ backgroundColor: variant.color.hexCode }}
            />
          )}
          <span className="text-neutral-500">{variant.color?.name ?? "—"}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="font-medium">{formatPaise(variant.price)}</div>
        {variant.compareAtPrice && (
          <div className="text-xs text-neutral-400 line-through">
            {formatPaise(variant.compareAtPrice)}
          </div>
        )}
      </td>

      <td className="px-6 py-4">
        <span
          className={clsx(
            isOutOfStock && "text-red-600",
            isLowStock && "text-amber-600",
          )}
        >
          {variant.stock}
        </span>
      </td>

      <td className="px-6 py-4">
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium",
            variant.isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700",
          )}
        >
          {variant.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(variant)}
            type="button"
            aria-label={`Edit ${variant.sku}`}
            className="rounded-lg p-2 transition hover:bg-neutral-100"
          >
            <Pencil size={18} />
          </button>

          <button
            onClick={() => onDelete(variant)}
            type="button"
            aria-label={`Delete ${variant.sku}`}
            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
