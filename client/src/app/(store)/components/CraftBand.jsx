import Image from "next/image";

/**
 * The dark "story" band that breaks up the run of light product grids.
 *
 * The reference design this is modelled on carries its weight with
 * business stats ("12,000+ homes furnished", "18 yrs of craftsmanship",
 * "4.8/5 average rating"). None of those can ever be true here, and
 * ADR-041 rules them out. The numbers below are the honest substitute:
 * real counts, computed from the catalog itself and passed in by the
 * homepage — they describe the catalog, not an invented company history.
 */
export default function CraftBand({ stats, image }) {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-8 sm:px-10">
      <div className="overflow-hidden rounded-2xl bg-stone-950">
        <div className="grid items-center gap-10 p-10 lg:grid-cols-2 lg:p-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D6BFA7]">
              Our craft
            </p>
            <h2 className="mt-4 font-heading text-3xl leading-tight text-white sm:text-4xl">
              Built to be lived with,
              <span className="block italic text-[#D6BFA7]">not just looked at</span>
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-stone-400">
              Every piece in the Nestro catalog is described the way it
              actually is — real materials, real dimensions, real stock. No
              invented reviews, no borrowed ratings, no numbers that only
              exist to fill a page.
            </p>

            {stats?.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-heading text-3xl text-white">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.15em] text-stone-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {image?.url && (
            <div className="relative h-64 overflow-hidden rounded-xl lg:h-80">
              <Image
                src={image.url}
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
