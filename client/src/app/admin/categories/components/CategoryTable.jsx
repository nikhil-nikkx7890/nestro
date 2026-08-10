"use client";

import { Search } from "lucide-react";

import CategoryRow from "./CategoryRow";
import EmptyState from "@/components/ui/EmptyState";

export default function CategoryTable({
    categories,
    loading,
    error,
    openModal,
    onEdit,
    onDelete,
}) {
    if (loading) {
        return (
            <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
                Loading categories...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-600">
                {error}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 p-6">
                <div className="relative max-w-sm">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
                    />
                </div>
            </div>

            {categories.length === 0 ? (
                <EmptyState
                    openModal={openModal}
                    title="No Categories Found"
                    message="Create your first furniture category."
                    buttonLabel="Add Category"
                />
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-neutral-200 text-left">
                            <th className="px-6 py-4 text-sm font-semibold">
                                Category
                            </th>

                            <th className="px-6 py-4 text-sm font-semibold">
                                Slug
                            </th>

                            <th className="px-6 py-4 text-sm font-semibold">
                                Products
                            </th>

                            <th className="px-6 py-4 text-sm font-semibold">
                                Status
                            </th>

                            <th className="px-6 py-4 text-right text-sm font-semibold">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {categories.map((category) => (
                            <CategoryRow
                                key={category._id}
                                category={category}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}