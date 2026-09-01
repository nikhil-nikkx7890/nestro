import Link from "next/link";

export const metadata = {
  title: "About — Nestro",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8B5E3C]">About</p>
      <h1 className="mt-4 font-heading text-4xl text-[#1C1917]">Our Story</h1>

      <div className="mt-8 space-y-6 leading-relaxed text-[#57534E]">
        <p>
          Nestro started from a simple frustration: most furniture shopping
          online feels the same — endless grids of near-identical pieces,
          with no sense of who chose them or why. We wanted a smaller,
          more considered catalog, where every piece earns its place.
        </p>
        <p>
          Every product on Nestro is organized by category, room, material
          and color so you can shop the way you actually think about
          furnishing a home — not just by browsing everything at once.
        </p>
        <p>
          We&apos;re still early. The catalog will grow, and the way we
          present it will keep improving. What won&apos;t change is the
          principle we started with: show real products, honestly, and
          never dress up the page with anything that isn&apos;t true.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-[#E7E5E4] bg-[#F5F5F4] p-6">
        <h2 className="font-heading text-xl text-[#1C1917]">What we care about</h2>
        <ul className="mt-4 space-y-3 text-sm text-[#57534E]">
          <li>
            <span className="font-medium text-[#1C1917]">Considered materials</span>{" "}
            — every product lists the materials and colors it actually comes
            in, not marketing copy standing in for specifications.
          </li>
          <li>
            <span className="font-medium text-[#1C1917]">Honest presentation</span>{" "}
            — no fabricated reviews, ratings, or invented numbers anywhere
            on this site. If something isn&apos;t real yet, we leave it out.
          </li>
          <li>
            <span className="font-medium text-[#1C1917]">Built to last</span>{" "}
            — furniture chosen for how it holds up, not just how it
            photographs.
          </li>
        </ul>
      </div>

      <p className="mt-10 text-sm text-[#78716C]">
        Have a question before you buy?{" "}
        <Link href="/contact" className="font-medium text-[#8B5E3C] hover:underline">
          Get in touch
        </Link>
        .
      </p>
    </div>
  );
}
