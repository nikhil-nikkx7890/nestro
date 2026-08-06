import { Pencil, Trash2 } from "lucide-react";
import { toTitleCase } from "@/utils/formatters";

export default function MaterialRow({
    material,
    onEdit,
    onDelete,
}) {
    return (
        <tr className="border-b border-neutral-100 transition hover:bg-neutral-50">
            <td className="px-6 py-4 font-medium">
                {toTitleCase(material.name)}
            </td>

            <td className="px-6 py-4 text-neutral-500">
                {material.slug}
            </td>

            <td className="px-6 py-4">
                N/A
            </td>

            <td className="px-6 py-4">
                <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                        material.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                    }`}
                >
                    {material.isActive ? "Active" : "Inactive"}
                </span>
            </td>

            <td className="px-6 py-4">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onEdit(material)}
                        className="rounded-lg p-2 transition hover:bg-neutral-100"
                    >
                        <Pencil size={18} />
                    </button>

                    <button
                        onClick={() => onDelete(material)}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
}