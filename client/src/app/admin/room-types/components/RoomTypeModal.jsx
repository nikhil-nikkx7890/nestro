import RoomTypeForm from "./RoomTypeForm";

export default function RoomTypeModal({
                                          isOpen,
                                          onClose,
                                          roomType,
                                          onSubmit,
                                          isSubmitting,
                                      }) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">
                        {roomType ? "Edit Room Type" : "Create Room Type"}
                    </h2>

                    <button onClick={onClose}>✕</button>
                </div>

                <RoomTypeForm
                    roomType={roomType}
                    onSubmit={onSubmit}
                    onClose={onClose}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}