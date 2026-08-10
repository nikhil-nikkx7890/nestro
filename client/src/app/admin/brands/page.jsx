"use client";

import { Plus } from "lucide-react";

import BrandTable from "./components/BrandTable";
import BrandModal from "./components/BrandModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "@/services/brand.service";

import { toTitleCase } from "@/utils/formatters";
import { useCrud } from "@/hooks/useCrud";

export default function BrandsPage() {
  const {
    items: brands,
    selectedItem: selectedBrand,
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
    list: getBrands,
    create: createBrand,
    update: updateBrand,
    remove: deleteBrand,
    entityName: "Brand",
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Brands</h1>

          <p className="mt-2 text-neutral-500">Manage all furniture brands.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Plus size={18} />
          Add Brand
        </button>
      </div>

      <BrandTable
        brands={brands}
        loading={loading}
        error={error}
        openModal={openCreateModal}
        onEdit={handleEdit}
        onDelete={openDeleteModal}
      />

      <BrandModal
        isOpen={isModalOpen}
        onClose={closeModal}
        brand={selectedBrand}
        onSubmit={selectedBrand ? handleUpdate : handleCreate}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Brand"
        message={`Are you sure you want to delete "${toTitleCase(selectedBrand?.name)}" ?`}
        confirmText="Delete"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
