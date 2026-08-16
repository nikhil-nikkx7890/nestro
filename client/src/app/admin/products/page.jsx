"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import ProductTable from "./components/ProductTable";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import { productService } from "@/services/product.service";

import { useResourceList } from "@/hooks/useResourceList";

export default function ProductsPage() {
  const router = useRouter();

  const {
    items: products,
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
  } = useResourceList({
    list: productService.list,
    entityName: "Product",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const startDelete = (product) => {
    setDeleteTarget(product);

    if (product.variantCount > 0) {
      setDeleteMessage(
        `This product has ${product.variantCount} variant${product.variantCount > 1 ? "s" : ""}. Deleting "${product.name}" will also delete all of its variants.`,
      );
    } else {
      setDeleteMessage(`Are you sure you want to delete "${product.name}"?`);
    }
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      // First attempt: no confirmCascade. If the product has variants
      // the backend responds with success: false instead of throwing,
      // so we check response.success rather than relying on a caught error.
      const response = await productService.remove(deleteTarget._id);

      if (response.success === false) {
        // Backend confirmed there's a cascade — re-ask with the exact
        // count from the server, the source of truth over the list's value.
        setDeleteMessage(`${response.message} This action cannot be undone.`);
        return;
      }

      toast.success("Product deleted successfully.");
      setDeleteTarget(null);
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmCascadeDelete = async () => {
    try {
      setIsDeleting(true);
      await productService.remove(deleteTarget._id, { confirmCascade: true });
      toast.success("Product and its variants deleted successfully.");
      setDeleteTarget(null);
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Products</h1>

          <p className="mt-2 text-neutral-500">
            Manage all furniture products.
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/products/new")}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <ProductTable
        products={products}
        loading={loading}
        error={error}
        onAdd={() => router.push("/admin/products/new")}
        onEdit={(product) => router.push(`/admin/products/${product._id}/edit`)}
        onDelete={startDelete}
        search={search}
        setSearch={setSearch}
        page={page}
        setPage={goToPage}
        pagination={pagination}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={
          deleteTarget?.variantCount > 0 ? confirmCascadeDelete : confirmDelete
        }
        title="Delete Product"
        message={deleteMessage}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
