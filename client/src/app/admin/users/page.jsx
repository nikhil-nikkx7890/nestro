"use client";

import { useState } from "react";
import { toast } from "sonner";

import UserTable from "./components/UserTable";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import { userService } from "@/services/user.service";
import { useResourceList } from "@/hooks/useResourceList";
import { useAuth } from "@/context/AuthContext";

/**
 * The user directory. Read plus one write (activate/deactivate) — no
 * create, edit, role change or delete, matching what the API exposes and
 * why (see server/src/controllers/user.controller.js).
 */
export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [roleFilter, setRoleFilter] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    items: users,
    loading,
    error,
    refetch,
    search,
    setSearch,
    page,
    goToPage,
    pagination,
    sortBy,
    sortOrder,
    handleSort,
    isActive,
    handleFilterActive,
  } = useResourceList({
    list: userService.list,
    entityName: "User",
    extraParams: { role: roleFilter || undefined },
  });

  // Activating is harmless and applies straight away; deactivating cuts
  // someone's access on their very next request, so it gets a confirm.
  const handleToggle = async (user) => {
    if (user.isActive) {
      setPendingUser(user);
      return;
    }
    await applyStatus(user, true);
  };

  const applyStatus = async (user, nextStatus) => {
    try {
      setIsSubmitting(true);
      const response = await userService.setStatus(user._id, nextStatus);
      toast.success(response.message);
      setPendingUser(null);
      await refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't update the account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Users</h1>

        <p className="mt-2 text-neutral-500">
          Every registered account. Deactivating one blocks it on its very
          next request — accounts are never deleted, since carts, wishlists
          and reviews reference them.
        </p>
      </div>

      <UserTable
        users={users}
        loading={loading}
        error={error}
        currentUserId={currentUser?.id ?? currentUser?._id}
        onToggleStatus={handleToggle}
        search={search}
        setSearch={setSearch}
        page={page}
        setPage={goToPage}
        pagination={pagination}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        isActive={isActive}
        handleFilterActive={handleFilterActive}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(pendingUser)}
        onClose={() => setPendingUser(null)}
        onConfirm={() => applyStatus(pendingUser, false)}
        title="Deactivate Account"
        message={`Deactivate ${pendingUser?.name}'s account (${pendingUser?.email})? They'll be signed out on their next request and won't be able to log back in until reactivated.`}
        confirmText="Deactivate"
        submittingText="Deactivating..."
        isIrreversible={false}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
