"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

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

export default function BrandsPage(){
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const response = await getBrands();
            setBrands(response.data);
            setError("");
        }catch (error) {
            console.error(error);
            setError("Failed to fetch brands.");


        }finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    },[]);

    const handleOpenCreateModal = () => {
        setSelectedBrand(null);
        setIsModalOpen(true);
    };

    const handleEditBrand = (brand) => {
        setSelectedBrand(brand);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setSelectedBrand(null);
        setIsModalOpen(false);
    }

    const handleOpenDeleteModal = (brand) => {
        setSelectedBrand(brand);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setSelectedBrand(null);
        setIsDeleteModalOpen(false);
    };

    const handleCreateBrand = async (formData) => {
        try {
            setIsSubmitting(true);
            await createBrand(formData);
            toast.success("Brand created successfully!");
            await fetchBrands();
            handleCloseModal();
        }catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || "Failed to create brand."
            );
        }finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateBrand = async (formData) => {
        try {
            setIsSubmitting(true);
            await updateBrand(selectedBrand._id, formData);
            toast.success("Brand updated successfully!");
            await fetchBrands();
            handleCloseModal();
        }catch (error) {
            console.error(
                error.response?.data?.message || "Failed to update brand.",
            )
        }finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBrand = async () => {
    try {
        setIsSubmitting(true);
        await deleteBrand(selectedBrand._id);
        toast.success("Brand deleted successfully!");
        await fetchBrands();
        handleCloseDeleteModal()
    }catch (error) {
        console.error(error);

        toast.error(
            error.response?.data?.message || "Failed to delete brand."
        );
        }   finally {
        setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Brands</h1>

                    <p className="mt-2 text-neutral-500">
                        Manage all furniture brands.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
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
                openModal={handleOpenCreateModal}
                onEdit={handleEditBrand}
                onDelete={handleOpenDeleteModal}
            />

            <BrandModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                brand={selectedBrand}
                onSubmit={
                    selectedBrand ? handleUpdateBrand : handleCreateBrand
                }
                isSubmitting={isSubmitting}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteBrand}
                title="Delete Brand"
                message={`Are you sure you want to delete "${toTitleCase(selectedBrand?.name)}" ?`}
                confirmText="Delete"
                isSubmitting={isSubmitting}
            />
        </div>
    );

}