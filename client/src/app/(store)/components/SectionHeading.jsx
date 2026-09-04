import Link from "next/link";

/**
 * One heading shape for every storefront section: a small eyebrow label
 * above a large title, with an optional "view all" link on the right.
 * Introduced because the homepage's sections were three bare <h2>s of the
 * same size, which read as one undifferentiated block while scrolling.
 */
export default function SectionHeading({ eyebrow, title, action }) {
  return (
    // Stacked on small screens: a two-line wrapped heading with the action
    // link aligned to its bottom edge reads as a misaligned L shape, so
    // the link only sits beside the title once there's room for one line.
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B5E3C]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-3 font-heading text-2xl text-[#1C1917] sm:text-3xl lg:text-4xl">
          {title}
        </h2>
      </div>

      {action && (
        <Link
          href={action.href}
          className="shrink-0 text-sm font-medium text-[#8B5E3C] hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
