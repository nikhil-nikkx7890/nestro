"use client";

import { Plus } from "lucide-react";

import MaterialTable from "./components/MaterialTable";
import MaterialModal from "./components/MaterialModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import { materialService } from "@/services/material.service";

import { toTitleCase } from "@/utils/formatters";
import { useCrud } from "@/hooks/useCrud";

export default function MaterialsPage() {
  const {
    items: materials,
    selectedItem: selectedMaterial,
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
  } = useCrud({
    ...materialService,
    entityName: "Material",
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Materials</h1>

          <p className="mt-2 text-neutral-500">
            Manage all furniture materials.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Plus size={18} />
          Add Material
        </button>
      </div>

      <MaterialTable
        materials={materials}
        loading={loading}
        error={error}
        openModal={openCreateModal}
        onEdit={handleEdit}
        onDelete={openDeleteModal}
      />

      <MaterialModal
        isOpen={isModalOpen}
        onClose={closeModal}
        material={selectedMaterial}
        onSubmit={selectedMaterial ? handleUpdate : handleCreate}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Material"
        message={`Are you sure you want to delete "${toTitleCase(selectedMaterial?.name)}"?`}
        confirmText="Delete"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
