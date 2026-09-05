"use client";

import { Search, ShieldCheck, User as UserIcon } from "lucide-react";

import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";
import StatusFilter from "@/components/ui/StatusFilter";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function UserTable({
  users,
  loading,
  error,
  currentUserId,
  onToggleStatus,
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
  roleFilter,
  setRoleFilter,
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
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
          >
            <option value="">All roles</option>
            <option value="admin">Admins</option>
            <option value="customer">Customers</option>
          </select>

          <StatusFilter isActive={isActive} onChange={handleFilterActive} />
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-neutral-500">Loading users...</div>
      ) : error ? (
        <div className="p-10 text-center text-red-600">{error}</div>
      ) : users.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-medium">No users found</p>
          <p className="mt-1 text-sm text-neutral-500">
            Nothing matches this search or filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <SortableHeader
                  label="Name"
                  field="name"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Email"
                  field="email"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Role"
                  field="role"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Joined"
                  field="createdAt"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />

                <th className="px-6 py-4 text-right text-sm font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const isSelf = String(user._id) === String(currentUserId);

                return (
                  <tr key={user._id} className="border-b border-neutral-100 last:border-0">
                    <td className="whitespace-nowrap px-6 py-4 font-medium">
                      {user.name}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-neutral-500">You</span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">
                      {user.email}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <ShieldCheck size={12} />
                        ) : (
                          <UserIcon size={12} />
                        )}
                        {user.role}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {/* Disabled on your own row: the API refuses it
                          anyway, and a button that always errors is worse
                          than one that's visibly unavailable. */}
                      <button
                        onClick={() => onToggleStatus(user)}
                        disabled={isSelf}
                        title={isSelf ? "You can't change your own status" : undefined}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {user.isActive ? "Active" : "Deactivated"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
