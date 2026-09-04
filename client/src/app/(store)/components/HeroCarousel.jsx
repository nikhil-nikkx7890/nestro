"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Curated, static slide content (ADR-046) — the categories named here
// are matched by name against the real categories the homepage already
// fetches (top 8 by displayOrder), so each CTA links to a real
// /products?category=<id> filter rather than a hardcoded ObjectId that
// would break on a reseed. A slide whose category isn't in that fetched
// set is dropped rather than shown broken — see the .filter() below.
const SLIDES = [
  {
    categoryName: "Wardrobes",
    label: "The Wardrobe Collection",
    tagline: "Storage that looks as good as the room it's in.",
    image: "https://images.unsplash.com/photo-1672137233327-37b0c1049e77?w=1920&q=80&fit=crop&auto=format",
  },
  {
    categoryName: "Beds",
    label: "The Bed Collection",
    tagline: "A frame that holds up as well on year five as day one.",
    image: "https://images.unsplash.com/photo-1560185128-e173042f79dd?w=1920&q=80&fit=crop&auto=format",
  },
  {
    categoryName: "Chairs",
    label: "The Chair Collection",
    tagline: "One good chair changes how a whole room feels.",
    image: "https://images.unsplash.com/photo-1563418536419-3a3ad6ef5efd?w=1920&q=80&fit=crop&auto=format",
  },
];

export default function HeroCarousel({ categories }) {
  const slides = SLIDES.map((slide) => ({
    ...slide,
    category: categories.find(
      (c) => c.name.toLowerCase() === slide.categoryName.toLowerCase(),
    ),
  })).filter((slide) => slide.category);

  if (slides.length === 0) return null;

  return (
    <section className="relative border-b border-stone-200">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        loop={slides.length > 1}
        className="hero-swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.categoryName}>
            <div
              className="relative flex h-[420px] items-center sm:h-[520px]"
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/45" />
              <div className="relative mx-auto max-w-[1440px] px-6 text-white sm:px-10">
                <p className="text-xs uppercase tracking-[0.2em] text-[#D6BFA7]">
                  Featured Collection
                </p>
                <h1 className="mt-4 max-w-xl font-heading text-3xl sm:text-5xl">
                  {slide.label}
                </h1>
                <p className="mt-4 max-w-md text-white/85">{slide.tagline}</p>
                <Link
                  href={`/products?category=${slide.category._id}`}
                  className="mt-8 inline-block rounded-lg bg-[#8B5E3C] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#6E4A2F]"
                >
                  Shop {slide.categoryName}
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Swiper's default nav/pagination colors are blue — retint to the
          storefront accent rather than fighting the library's CSS with
          !important overrides everywhere. */}
      <style jsx global>{`
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: #ffffff;
        }
        /* The arrows sit at the vertical middle, which on a phone lands
           directly on the slide's tagline. Swiping is the natural gesture
           there anyway, and the pagination bullets still show position. */
        @media (max-width: 639px) {
          .hero-swiper .swiper-button-next,
          .hero-swiper .swiper-button-prev {
            display: none;
          }
        }
        .hero-swiper .swiper-pagination-bullet {
          background: #ffffff;
          opacity: 0.6;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: #ffffff;
          opacity: 1;
        }
      `}</style>
    </section>
  );
}
