"use client";

import { Plus } from "lucide-react";

import CategoryTable from "./components/CategoryTable";
import CategoryModal from "./components/CategoryModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import { categoryService } from "@/services/category.service";

import { useCrud } from "@/hooks/useCrud";

export default function CategoriesPage() {
  const {
    items: categories,
    selectedItem: selectedCategory,
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
    ...categoryService,
    entityName: "Category",
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Categories</h1>

          <p className="mt-2 text-neutral-500">
            Manage all furniture categories.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <CategoryTable
        categories={categories}
        loading={loading}
        error={error}
        openModal={openCreateModal}
        onEdit={handleEdit}
        onDelete={openDeleteModal}
      />

      <CategoryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        category={selectedCategory}
        onSubmit={selectedCategory ? handleUpdate : handleCreate}
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}" ?`}
        confirmText="Delete"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
