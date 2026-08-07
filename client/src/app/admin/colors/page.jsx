"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import ColorTable from "./components/ColorTable";
import ColorModal from "./components/ColorModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import {
  createColor,
  deleteColor,
  getColors,
  updateColor,
} from "@/services/color.service";

import { toTitleCase } from "@/utils/formatters";

export default function ColorsPage() {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);

  const fetchColors = async () => {
    try {
      setLoading(true);

      const response = await getColors();

      setColors(response.data);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to fetch Colors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedColor(null);
    setIsModalOpen(true);
  };

  const handleEditColor = (color) => {
    setSelectedColor(color);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedColor(null);
    setIsModalOpen(false);
  };

  const handleOpenDeleteModal = (color) => {
    setSelectedColor(color);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setSelectedColor(null);
    setIsDeleteModalOpen(false);
  };

  const handleCreateColor = async (formData) => {
    try {
      setIsSubmitting(true);

      await createColor(formData);

      toast.success("Color created successfully.");

      await fetchColors();

      handleCloseModal();
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Failed to create Color.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateColor = async (formData) => {
    try {
      setIsSubmitting(true);

      await updateColor(selectedColor._id, formData);

      toast.success("Color updated successfully.");

      await fetchColors();

      handleCloseModal();
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Failed to update Color.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteColor = async () => {
    try {
      setIsSubmitting(true);

      await deleteColor(selectedColor._id);

      toast.success("Color deleted successfully.");

      await fetchColors();

      handleCloseDeleteModal();
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Failed to delete Color.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Colors</h1>

          <p className="mt-2 text-neutral-500">Manage all furniture colors.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
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
        openModal={handleOpenCreateModal}
        onEdit={handleEditColor}
        onDelete={handleOpenDeleteModal}
      />

      <ColorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        color={selectedColor}
        onSubmit={selectedColor ? handleUpdateColor : handleCreateColor}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteColor}
        title="Delete Color"
        message={`Are you sure you want to delete "${toTitleCase(selectedColor?.name)}"?`}
        confirmText="Delete"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
