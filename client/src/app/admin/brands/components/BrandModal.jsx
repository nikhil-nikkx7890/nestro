import BrandForm from "./BrandForm";

export default function BrandModal({
                                       isOpen,
                                       onClose,
                                       brand,
                                       onSubmit,
                                       isSubmitting,
                                   }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">
                        {brand ? "Edit Brand" : "Create Brand"}
                    </h2>

                    <button onClick={onClose}>✕</button>
                </div>

                <BrandForm
                    brand={brand}
                    onSubmit={onSubmit}
                    onClose={onClose}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}