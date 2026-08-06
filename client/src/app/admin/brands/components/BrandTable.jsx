"use client";

import { Search } from "lucide-react";

import BrandRow from "./BrandRow";
import EmptyState from "./EmptyState";

export default function BrandTable({
                                       brands,
                                       loading,
                                       error,
                                       openModal,
                                       onEdit,
                                       onDelete,
                                   }) {
    if (loading) {
        return (
            <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
                Loading Brands...
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

    // TODO: Implement search

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
                        placeholder="Search Brands..."
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
                    />
                </div>
            </div>

            {brands.length === 0 ? (
                <EmptyState openModal={openModal} />
            ) : (
                <table className="w-full">
                    <thead>
                    <tr className="border-b border-neutral-200 text-left">
                        <th className="px-6 py-4 text-sm font-semibold">
                            Brand
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
                    {brands.map((brand) => (
                        <BrandRow
                            key={brand._id}
                            brand={brand}
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