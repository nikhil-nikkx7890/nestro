"use client"

export default function DeleteConfirmationModal({
                                                    isOpen,
                                                    onClose,
                                                    onConfirm,
                                                    title,
                                                    message,
                                                    confirmText = "Delete",
                                                    isSubmitting = false,
                                                }
) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="border-b border-neutral-200 px-6 py-4">
                    <h2 className="text-xl font-semibold text-neutral-900">
                        {title}
                    </h2>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-sm leading-6 text-neutral-600">
                        {message}
                    </p>

                    <p className="mt-3 text-sm font-medium text-red-600">
                        This action cannot be undone.
                    </p>
                </div>
                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? "Deleting..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}