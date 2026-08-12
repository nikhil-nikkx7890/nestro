"use client";

import { Plus } from "lucide-react";

import ColorTable from "./components/ColorTable";
import ColorModal from "./components/ColorModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import { colorService } from "@/services/color.service";

import { toTitleCase } from "@/utils/formatters";
import { useCrud } from "@/hooks/useCrud";

export default function ColorsPage() {
  const {
    items: colors,
    selectedItem: selectedColor,
    loading,
    error,
    isSubmitting,
    isModalOpen,
    isDeleteModalOpen,
    openCreateModal,
    closeModal,
    handleEdit,
    openDeleteModal,
    closeDeleteModal,
    handleCreate,
    handleUpdate,
    handleDelete,
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
  } = useCrud({
    ...colorService,
    entityName: "Color",
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Colors</h1>

          <p className="mt-2 text-neutral-500">Manage all furniture colors.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Plus size={18} />
          Add Color
        </button>
      </div>

      <ColorTable
        colors={colors}
        loading={loading}
        error={error}
        openModal={openCreateModal}
        onEdit={handleEdit}
        onDelete={openDeleteModal}
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
      />

      <ColorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        color={selectedColor}
        onSubmit={selectedColor ? handleUpdate : handleCreate}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Color"
        message={`Are you sure you want to delete "${toTitleCase(selectedColor?.name)}"?`}
        confirmText="Delete"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
