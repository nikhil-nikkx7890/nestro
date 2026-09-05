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
  // False until the server has answered 409 and named what the cascade
  // would take with it; true means the next confirm carries confirmCascade.
  const [cascadeWarned, setCascadeWarned] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleteMessage("");
    setCascadeWarned(false);
  };

  const startDelete = (product) => {
    setDeleteTarget(product);
    setCascadeWarned(false);
    setDeleteMessage(`Are you sure you want to delete "${product.name}"?`);
  };

  /**
   * One handler for both passes. The first click deletes without
   * `confirmCascade`; if the product has children the server refuses with
   * 409 and a message naming them, which is rendered as the new modal body
   * and re-armed for a second click that does carry `confirmCascade`.
   *
   * The message is taken from the server verbatim rather than rebuilt here.
   * The list rows carry `variantCount`, but a review count that matched the
   * server's would mean duplicating the controller's own counting and
   * pluralisation in a second place — and the row is a snapshot from the
   * last fetch, while the 409 is counted at the moment of the delete.
   */
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await productService.remove(
        deleteTarget._id,
        cascadeWarned ? { confirmCascade: true } : {},
      );

      toast.success(response.message || "Product deleted successfully.");
      closeDelete();
      await refetch();
    } catch (err) {
      const { status, data } = err.response ?? {};

      // The cascade gate (ADR-057), not a failure: 409 carrying the child
      // counts. Anything else — including a 409 from some other guard — is
      // a real error and still gets a toast.
      const isCascadeGate =
        status === 409 &&
        (data?.variantCount !== undefined || data?.reviewCount !== undefined);

      if (isCascadeGate) {
        // No " This action cannot be undone." appended: the modal already
        // renders that line itself from `isIrreversible`.
        setDeleteMessage(data.message);
        setCascadeWarned(true);
        return;
      }

      console.error(err);
      toast.error(data?.message || "Failed to delete product.");
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
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={deleteMessage}
        // Names the wider action once the server has said there are
        // children, so the second click doesn't look like a repeat of the
        // first one that appeared to do nothing.
        confirmText={cascadeWarned ? "Delete everything" : "Delete"}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
