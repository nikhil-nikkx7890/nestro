import Link from "next/link";

/**
 * One heading shape for every storefront section: a small eyebrow label
 * above a large title, with an optional "view all" link on the right.
 * Introduced because the homepage's sections were three bare <h2>s of the
 * same size, which read as one undifferentiated block while scrolling.
 */
export default function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B5E3C]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-3 font-heading text-3xl text-[#1C1917] sm:text-4xl">
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
