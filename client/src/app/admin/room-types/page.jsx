"use client";

import {useEffect, useState} from "react";
import {Plus} from "lucide-react";
import {toast} from "sonner";

import RoomTypeTable from "./components/RoomTypeTable";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import {createRoomType, deleteRoomType, getRoomTypes, updateRoomType,} from "@/services/roomType.service";
import RoomTypeModal from "@/app/admin/room-types/components/RoomTypeModal";
import {toTitleCase} from "@/utils/formatters";

export default function RoomTypesPage() {
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRoomType, setSelectedRoomType] = useState(null);

    const fetchRoomTypes = async () => {
        try {
            setLoading(true);

            const response = await getRoomTypes();

            setRoomTypes(response.data);
            setError("");
        } catch (error) {
            console.error(error);
            setError("Failed to fetch Room Types.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchRoomTypes();
    }, []);

    const handleOpenCreateModal = () => {
        setSelectedRoomType(null);
        setIsModalOpen(true);
    };
    const handleOpenDeleteModal = (roomType) => {
        setSelectedRoomType(roomType);
        setIsDeleteModalOpen(true);
    };
    const handleCloseDeleteModal = () => {
        setSelectedRoomType(null);
        setIsDeleteModalOpen(false);
    }

    const handleEditRoomType = (roomType) => {
        setSelectedRoomType(roomType);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRoomType(null);
    };

    const handleCreateRoomType = async (formData) => {
        try {
            setIsSubmitting(true);

            await createRoomType(formData);

            toast.success("Room Type created successfully.");

            await fetchRoomTypes();

            handleCloseModal();
        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.message || "Failed to create Room Type.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleUpdateRoomType = async (formData) => {
        try {
            setIsSubmitting(true);

            await updateRoomType(selectedRoomType._id, formData);

            toast.success("Room Type updated successfully.");

            await fetchRoomTypes();

            handleCloseModal();
        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.message || "Failed to update Room Type.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleDeleteRoomType = async () =>{
        try {
            setIsSubmitting(true);
            await deleteRoomType(selectedRoomType._id);
            toast.success("Room Type deleted successfully.");
            await fetchRoomTypes();
            handleCloseDeleteModal();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || "Failed to delete Room Type.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Room Types</h1>

                    <p className="mt-2 text-neutral-500">
                        Manage all Room Types.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                    <Plus size={18} />
                    Add Room Type
                </button>
            </div>

            <RoomTypeTable
                roomTypes={roomTypes}
                loading={loading}
                error={error}
                openModal={handleOpenCreateModal}
                onEdit={handleEditRoomType}
                onDelete={handleOpenDeleteModal}
            />

            <RoomTypeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                roomType={selectedRoomType}
                onSubmit={
                    selectedRoomType ? handleUpdateRoomType : handleCreateRoomType
                }
                isSubmitting={isSubmitting}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteRoomType}
                title="Delete Room Type"
                message={`Are you sure you want to delete "${toTitleCase(selectedRoomType?.name)}" ?`}
                confirmText="Delete"
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
