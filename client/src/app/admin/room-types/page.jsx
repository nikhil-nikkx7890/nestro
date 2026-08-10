"use client";

import { Plus } from "lucide-react";

import RoomTypeTable from "./components/RoomTypeTable";
import RoomTypeModal from "@/app/admin/room-types/components/RoomTypeModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import { roomTypeService } from "@/services/roomType.service";

import { toTitleCase } from "@/utils/formatters";
import { useCrud } from "@/hooks/useCrud";

export default function RoomTypesPage() {
  const {
    items: roomTypes,
    selectedItem: selectedRoomType,
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
  } = useCrud({
    ...roomTypeService,
    entityName: "Room Type",
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Room Types</h1>

          <p className="mt-2 text-neutral-500">Manage all Room Types.</p>
        </div>

        <button
          onClick={openCreateModal}
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
        openModal={openCreateModal}
        onEdit={handleEdit}
        onDelete={openDeleteModal}
      />

      <RoomTypeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        roomType={selectedRoomType}
        onSubmit={selectedRoomType ? handleUpdate : handleCreate}
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Room Type"
        message={`Are you sure you want to delete "${toTitleCase(selectedRoomType?.name)}" ?`}
        confirmText="Delete"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
