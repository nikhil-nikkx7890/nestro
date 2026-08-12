"use client";

import { Search } from "lucide-react";

import RoomTypeRow from "./RoomTypeRow";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";
import StatusFilter from "@/components/ui/StatusFilter";

export default function RoomTypeTable({
    roomTypes,
    loading,
    error,
    openModal,
    onEdit,
    onDelete,
    search,
    setSearch,
    pagination,
    page,
    setPage,
    sortBy,
    sortOrder,
    handleSort,
    isActive,
    handleFilterActive,
}) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b border-neutral-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                        type="text"
                        placeholder="Search Room Types..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
                    />
                </div>

                <StatusFilter isActive={isActive} onChange={handleFilterActive} />
            </div>

            {loading ? (
                <div className="p-10 text-center text-neutral-500">
                    Loading Room Types...
                </div>
            ) : error ? (
                <div className="p-10 text-center text-red-600">{error}</div>
            ) : roomTypes.length === 0 ? (
                <EmptyState
                    openModal={openModal}
                    title="No Room Types Found"
                    message="Create your first Room Type."
                    buttonLabel="Add Room Type"
                />
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-neutral-200 text-left">
                            <SortableHeader
                                label="Room Type"
                                field="name"
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSort={handleSort}
                            />

                            <th className="px-6 py-4 text-sm font-semibold">
                                Slug
                            </th>

                            <th className="px-6 py-4 text-sm font-semibold">
                                Products
                            </th>

                            <SortableHeader
                                label="Status"
                                field="isActive"
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSort={handleSort}
                            />

                            <th className="px-6 py-4 text-right text-sm font-semibold">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {roomTypes.map((roomType) => (
                            <RoomTypeRow
                                key={roomType._id}
                                roomType={roomType}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </tbody>
                </table>
            )}
            <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
    );
}