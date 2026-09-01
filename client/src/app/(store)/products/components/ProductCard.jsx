import Link from "next/link";
import Image from "next/image";

import { toTitleCase } from "@/utils/formatters";

export default function ProductCard({ product }) {
  const image = product.images?.[0];

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
      </div>
    </Link>
  );
}
