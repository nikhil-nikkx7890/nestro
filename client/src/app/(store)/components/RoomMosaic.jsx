import Link from "next/link";
import Image from "next/image";

import { toTitleCase } from "@/utils/formatters";
import SectionHeading from "./SectionHeading";

/**
 * Rooms as an asymmetric mosaic — one large tile carrying the section,
 * four smaller ones beside it — instead of five equal tiles. The size
 * difference is what creates hierarchy; a uniform grid gives every room
 * the same weight and reads flat.
 */
function RoomTile({ roomType, large = false }) {
  return (
    <Link
      href={`/products?roomType=${roomType._id}`}
      className={`group relative block overflow-hidden rounded-2xl bg-[#F5F5F4] ${
        large ? "h-full min-h-[280px] lg:min-h-[420px]" : "h-[200px]"
      }`}
    >
      {roomType.image?.url ? (
        <Image
          src={roomType.image.url}
          alt={roomType.name}
          fill
          sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-[#A8A29E]">
          {toTitleCase(roomType.name)}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <div className="absolute bottom-0 left-0 p-5">
        <p className={`font-heading text-white ${large ? "text-2xl" : "text-lg"}`}>
          {toTitleCase(roomType.name)}
        </p>
        <p className="text-xs text-white/85">
          {roomType.productCount}{" "}
          {roomType.productCount === 1 ? "piece" : "pieces"}
        </p>
      </div>
    </Link>
  );
}

export default function RoomMosaic({ items }) {
  if (!items.length) return null;

  const [featured, ...rest] = items;
  const secondary = rest.slice(0, 4);

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10">
      <SectionHeading eyebrow="Curated by space" title="Shop by Room" />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <RoomTile roomType={featured} large />

        <div className="grid gap-5 sm:grid-cols-2">
          {secondary.map((roomType) => (
            <RoomTile key={roomType._id} roomType={roomType} />
          ))}
        </div>
      </div>
    </section>
  );
}
