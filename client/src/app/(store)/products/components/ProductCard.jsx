import Link from "next/link";
import Image from "next/image";

import { toTitleCase, formatPaise } from "@/utils/formatters";

const NEW_ARRIVAL_WINDOW_DAYS = 21;

// Both badges are computed from real data, never invented (ADR-041's
// no-fabricated-social-proof rule applies to badges too, not just
// reviews/ratings) — discount from the actual price/compareAtPrice the
// listing aggregation already computed, "New" from the product's actual
// createdAt.
const isNewArrival = (createdAt) => {
  if (!createdAt) return false;
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return ageDays <= NEW_ARRIVAL_WINDOW_DAYS;
};

const discountPercent = (price, compareAtPrice) => {
  if (!price || !compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

export default function ProductCard({ product }) {
  const image = product.images?.[0];
  const discount = discountPercent(product.fromPrice, product.compareAtPrice);
  const showNewBadge = !discount && isNewArrival(product.createdAt);

  return (
    <Link href={`/products/${product._id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F5F5F4]">
        {image?.url ? (
          <Image
            src={image.url}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#A8A29E]">
            No image
          </div>
        )}

        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-[#1C1917] px-3 py-1 text-xs font-medium text-white">
            -{discount}%
          </span>
        )}
        {showNewBadge && (
          <span className="absolute left-3 top-3 rounded-full bg-[#8B5E3C] px-3 py-1 text-xs font-medium text-white">
            New
          </span>
        )}
      </div>

      <div className="mt-4 space-y-1">
        {product.category?.name && (
          <p className="text-xs uppercase tracking-wide text-[#8B5E3C]">
            {product.category.name}
          </p>
        )}
        <h3 className="font-heading text-lg text-[#1C1917]">
          {toTitleCase(product.name)}
        </h3>
        {product.brand?.name && (
          <p className="text-sm text-[#78716C]">{product.brand.name}</p>
        )}

        {product.fromPrice != null && (
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-base font-semibold text-[#1C1917]">
              {formatPaise(product.fromPrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.fromPrice && (
              <span className="text-sm text-[#A8A29E] line-through">
                {formatPaise(product.compareAtPrice)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
