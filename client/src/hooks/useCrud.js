"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useResourceList } from "./useResourceList";

export function useCrud({ list, create, update, remove, entityName }) {
  const {
    items,
    loading,
    error,
    refetch: fetchItems,
    search,
    setSearch,
    page,
    setPage,
    goToPage,
    sortBy,
    sortOrder,
    handleSort,
    isActive,
    handleFilterActive,
    pagination,
  } = useResourceList({ list, entityName });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openCreateModal = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };
  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      await create(formData);
      toast.success(`${entityName} created successfully.`);
      await fetchItems();
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || `Failed to create ${entityName}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      await update(selectedItem._id, formData);
      toast.success(`${entityName} updated successfully.`);
      await fetchItems();
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || `Failed to update ${entityName}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await remove(selectedItem._id);
      toast.success(`${entityName} deleted successfully.`);
      await fetchItems();
      closeDeleteModal();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || `Failed to delete ${entityName}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    loading,
    error,
    isSubmitting,
    isModalOpen,
    isDeleteModalOpen,
    selectedItem,
    openCreateModal,
    closeModal,
    handleEdit,
    openDeleteModal,
    closeDeleteModal,
    handleCreate,
    handleUpdate,
    handleDelete,
    refetch: fetchItems,

    // Query state + controls
    search,
    setSearch,
    page,
    setPage,
    goToPage,
    sortBy,
    sortOrder,
    handleSort,
    isActive,
    handleFilterActive,
    pagination,
  };
}
