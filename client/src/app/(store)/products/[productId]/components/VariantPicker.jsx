import clsx from "clsx";

export default function VariantPicker({ variants, selectedVariant, onSelect }) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[#2B2621]">
        Color &amp; Material
      </p>

      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const isSelected = variant._id === selectedVariant?._id;

          return (
            <button
              key={variant._id}
              type="button"
              onClick={() => onSelect(variant)}
              disabled={!variant.isActive}
              className={clsx(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                isSelected
                  ? "border-[#B15E3B] bg-[#B15E3B]/10 text-[#B15E3B]"
                  : "border-[#D8CDBB] text-[#5A5147] hover:border-[#B15E3B]",
                !variant.isActive && "cursor-not-allowed opacity-40",
              )}
            >
              {variant.color?.hexCode && (
                <span
                  className="h-3.5 w-3.5 rounded-full border border-[#D8CDBB]"
                  style={{ backgroundColor: variant.color.hexCode }}
                />
              )}
              {variant.material?.name} &middot; {variant.color?.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
