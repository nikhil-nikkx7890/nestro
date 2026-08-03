"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import CategoryTable from "./components/CategoryTable";
import CategoryModal from "./components/CategoryModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import {
  getCategories,
  createCategory,
  updateCategory,
    deleteCategory,
} from "@/services/categoryService";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await getCategories();

      setCategories(response.data);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };
  const handleOpenDeleteModal = (category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };
  const handleCloseDeleteModal = () => {
    setSelectedCategory(null);
    setIsDeleteModalOpen(false);
  }

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleCreateCategory = async (formData) => {
    try {
      setIsSubmitting(true);

      await createCategory(formData);

      toast.success("Category created successfully.");

      await fetchCategories();

      handleCloseModal();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Failed to create category.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUpdateCategory = async (formData) => {
    try {
      setIsSubmitting(true);

      await updateCategory(selectedCategory._id, formData);

      toast.success("Category updated successfully.");

      await fetchCategories();

      handleCloseModal();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Failed to update category.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteCategory = async () =>{
    try {
      setIsSubmitting(true);
      await deleteCategory(selectedCategory._id);
      toast.success("Category deleted successfully.");
      await fetchCategories();
      handleCloseDeleteModal();
    } catch (error) {
      console.error(error);
      toast.error(
          error.response?.data?.message || "Failed to delete category.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onClick={handleOpenCreateModal}
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
        openModal={handleOpenCreateModal}
        onEdit={handleEditCategory}
        onDelete={handleOpenDeleteModal}
      />

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={selectedCategory}
        onSubmit={
          selectedCategory ? handleUpdateCategory : handleCreateCategory
        }
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmationModal
      isOpen={isDeleteModalOpen}
      onClose={handleCloseDeleteModal}
      onConfirm={handleDeleteCategory}
      title="Delete Category"
      message={`Are you sure you want to delete "${selectedCategory?.name}" ?`}
      confirmText="Delete"
      isSubmitting={isSubmitting}
      />
    </div>
  );
}
