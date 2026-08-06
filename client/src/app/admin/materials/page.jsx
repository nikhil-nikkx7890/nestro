"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import MaterialTable from "./components/MaterialTable";
import MaterialModal from "./components/MaterialModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import {
  createMaterial,
  deleteMaterial,
  getMaterials,
  updateMaterial,
} from "@/services/material.service";

import { toTitleCase } from "@/utils/formatters";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);

      const response = await getMaterials();

      setMaterials(response.data);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to fetch Materials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedMaterial(null);
    setIsModalOpen(true);
  };

  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMaterial(null);
    setIsModalOpen(false);
  };

  const handleOpenDeleteModal = (material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setSelectedMaterial(null);
    setIsDeleteModalOpen(false);
  };

  const handleCreateMaterial = async (formData) => {
    try {
      setIsSubmitting(true);

      await createMaterial(formData);

      toast.success("Material created successfully.");

      await fetchMaterials();

      handleCloseModal();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Failed to create Material.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMaterial = async (formData) => {
    try {
      setIsSubmitting(true);

      await updateMaterial(selectedMaterial._id, formData);

      toast.success("Material updated successfully.");

      await fetchMaterials();

      handleCloseModal();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Failed to update Material.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async () => {
    try {
      setIsSubmitting(true);

      await deleteMaterial(selectedMaterial._id);

      toast.success("Material deleted successfully.");

      await fetchMaterials();

      handleCloseDeleteModal();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Failed to delete Material.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onClick={handleOpenCreateModal}
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
        openModal={handleOpenCreateModal}
        onEdit={handleEditMaterial}
        onDelete={handleOpenDeleteModal}
      />

      <MaterialModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        material={selectedMaterial}
        onSubmit={
          selectedMaterial ? handleUpdateMaterial : handleCreateMaterial
        }
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteMaterial}
        title="Delete Material"
        message={`Are you sure you want to delete "${toTitleCase(selectedMaterial?.name)}"?`}
        confirmText="Delete"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
