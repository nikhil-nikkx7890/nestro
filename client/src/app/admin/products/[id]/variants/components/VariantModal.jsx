import VariantForm from "./VariantForm";

export default function VariantModal({
  isOpen,
  onClose,
  variant,
  onSubmit,
  isSubmitting,
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
    >
      <div className="mt-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {variant ? "Edit Variant" : "Add Variant"}
          </h2>

          <button type="button" aria-label="Close variant modal" onClick={onClose}>
            ✕
          </button>
        </div>

        <VariantForm
          variant={variant}
          onSubmit={onSubmit}
          onClose={onClose}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
