import CategoryForm from "./CategoryForm";

export default function CategoryModal({
    isOpen,
    onClose,
    category,
    onSubmit,
    isSubmitting,
}) {
    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">
                        {category ? "Edit Category" : "Create Category"}
                    </h2>

                    <button type="button" aria-label="Close category modal" onClick={onClose}>✕</button>
                </div>

                <CategoryForm
                    category={category}
                    onSubmit={onSubmit}
                    onClose={onClose}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}