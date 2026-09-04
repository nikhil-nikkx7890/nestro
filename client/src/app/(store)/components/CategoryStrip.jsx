import Link from "next/link";
import Image from "next/image";

import { toTitleCase } from "@/utils/formatters";
import SectionHeading from "./SectionHeading";

/**
 * Categories as a compact circular strip rather than the full-width tile
 * grid they used to share with Room Types. Both sections rendering the
 * same 4-across tile grid made the homepage read as one repeated block;
 * a category row is closer to navigation than to content, so it gets the
 * smaller, scannable shape and Rooms keeps the large imagery.
 */
export default function CategoryStrip({ items }) {
  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-10 sm:px-10 sm:py-16">
      <SectionHeading
        eyebrow="Browse"
        title="Shop by Category"
        action={{ label: "All furniture", href: "/products" }}
      />

      {/* -mx-6 px-6 lets the scroll strip run to the screen edge on
          mobile instead of being clipped at the section's padding, so a
          half-visible next item signals there's more to swipe. */}
      <div className="-mx-6 mt-8 flex gap-8 overflow-x-auto px-6 pb-2 sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-8">
        {items.map((category) => (
          <Link
            key={category._id}
            href={`/products?category=${category._id}`}
            className="group flex w-24 shrink-0 flex-col items-center gap-3 sm:w-auto"
          >
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[#F5F5F4]">
              {category.image?.url ? (
                <Image
                  src={category.image.url}
                  alt={category.name}
                  fill
                  sizes="96px"
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-[#A8A29E]">
                  {toTitleCase(category.name)}
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-[#1C1917]">
                {toTitleCase(category.name)}
              </p>
              <p className="text-xs text-[#78716C]">
                {category.productCount}{" "}
                {category.productCount === 1 ? "piece" : "pieces"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
