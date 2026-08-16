"use client";

import { Plus, ArrowLeft } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import VariantTable from "./components/VariantTable";
import VariantModal from "./components/VariantModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import { variantService } from "@/services/variant.service";
import { productService } from "@/services/product.service";

import { useCrud } from "@/hooks/useCrud";

export default function ProductVariantsPage() {
  const router = useRouter();
  const { id: productId } = useParams();
  const searchParams = useSearchParams();
  const isFirstVariant = searchParams.get("firstVariant") === "true";

  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getById(productId);
        setProduct(response.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product.");
      }
    };
    fetchProduct();
  }, [productId]);

  // variantService.list/create need productId bound in, since Variant's
  // routing is nested for those two operations — useCrud just expects
  // plain list(params)/create(data) functions, so we bind productId here
  // rather than changing useCrud itself.
  const {
    items: variants,
    selectedItem: selectedVariant,
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
  } = useCrud({
    list: (params) => variantService.list(productId, params),
    create: (data) => variantService.create(productId, data),
    update: variantService.update,
    remove: variantService.remove,
    entityName: "Variant",
  });

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push("/admin/products")}
        className="flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
      >
        <ArrowLeft size={16} />
        Back to Products
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            {product ? `Variants — ${product.name}` : "Variants"}
          </h1>
          <p className="mt-2 text-neutral-500">
            Manage purchasable variants for this product.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Plus size={18} />
          Add Variant
        </button>
      </div>

      {isFirstVariant && variants.length === 0 && !loading && (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-50 p-6">
          <p className="font-medium text-neutral-900">
            Your product needs at least one variant before it's sell-ready.
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            A variant holds the actual price, stock, material, and color —
            add one to get started.
          </p>
        </div>
      )}

      <VariantTable
        variants={variants}
        loading={loading}
        error={error}
        onAdd={openCreateModal}
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
      />

      <VariantModal
        isOpen={isModalOpen}
        onClose={closeModal}
        variant={selectedVariant}
        onSubmit={selectedVariant ? handleUpdate : handleCreate}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Variant"
        message={`Are you sure you want to delete the variant "${selectedVariant?.sku}"?`}
        confirmText="Delete"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
