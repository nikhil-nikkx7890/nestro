"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const DEBOUNCE_MS = 400;

export function useCrud({ list, create, update, remove, entityName }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Query state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isActive, setIsActive] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Debounce: wait until the user stops typing for DEBOUNCE_MS before
  // letting `search` actually trigger a refetch.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 whenever the search term changes
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await list({
        search: debouncedSearch || undefined,
        page,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
        isActive: isActive || undefined,
      });
      setItems(response.data);
      setPagination(response.pagination);
      setError("");
    } catch (error) {
      console.error(error);
      setError(`Failed to fetch ${entityName}s.`);
    } finally {
      setLoading(false);
    }
  }, [list, entityName, debouncedSearch, page, sortBy, sortOrder, isActive]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleFilterActive = (value) => {
    setIsActive(value);
    setPage(1);
  };

  // Wraps setPage with a scroll-to-top, used specifically for explicit
  // Prev/Next clicks — kept separate from the raw setPage so that the
  // silent page-1 resets above (search/sort/filter) don't also scroll.
  const goToPage = (newPage) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
