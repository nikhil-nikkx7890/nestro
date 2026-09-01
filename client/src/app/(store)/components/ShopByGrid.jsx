import Link from "next/link";
import Image from "next/image";

import { toTitleCase } from "@/utils/formatters";

// Shared by the homepage's Shop by Category and Shop by Room sections
// (ADR-041) — same card shape either way: image, name, and a real,
// computed product count (never an invented number).
export default function ShopByGrid({ title, items, hrefFor }) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
      <h2 className="font-heading text-2xl text-[#1C1917]">{title}</h2>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Link key={item._id} href={hrefFor(item)} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F5F5F4]">
              {item.image?.url ? (
                <Image
                  src={item.image.url}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-[#A8A29E]">
                  {toTitleCase(item.name)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="font-heading text-lg text-white">
                  {toTitleCase(item.name)}
                </p>
                <p className="text-xs text-white/85">
                  {item.productCount} {item.productCount === 1 ? "piece" : "pieces"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
