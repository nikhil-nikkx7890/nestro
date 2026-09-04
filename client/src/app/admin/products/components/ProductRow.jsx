import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

import { toTitleCase } from "@/utils/formatters";

const STATUS_STYLES = {
  draft: "bg-neutral-100 text-neutral-600",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-red-100 text-red-700",
};

export default function ProductRow({ product, onEdit, onDelete }) {
  return (
    <tr className="border-b border-neutral-100 transition hover:bg-neutral-50">
      {/* The table already scrolls horizontally on narrow screens, so a
          name should stay on one line and be scrolled to rather than
          wrapping into a four-line column. */}
      <td className="whitespace-nowrap px-6 py-4 font-medium">
        {toTitleCase(product.name)}
      </td>

      <td className="px-6 py-4 text-neutral-500">
        {product.category?.name ?? "—"}
      </td>

      <td className="px-6 py-4 text-neutral-500">
        {product.brand?.name ?? "—"}
      </td>

      <td className="px-6 py-4">
        <Link
          href={`/admin/products/${product._id}/variants`}
          className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
        >
          {product.variantCount > 0
            ? `${product.variantCount} variant${product.variantCount > 1 ? "s" : ""}`
            : "Add variants"}
        </Link>
      </td>

      <td className="px-6 py-4">
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium capitalize",
            STATUS_STYLES[product.status],
          )}
        >
          {product.status}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(product)}
            type="button"
            aria-label={`Edit ${product.name}`}
            className="rounded-lg p-2 transition hover:bg-neutral-100"
          >
            <Pencil size={18} />
          </button>

          <button
            onClick={() => onDelete(product)}
            type="button"
            aria-label={`Delete ${product.name}`}
            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
