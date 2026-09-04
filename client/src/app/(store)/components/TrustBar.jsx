import { Truck, RotateCcw, Wrench, ShieldCheck } from "lucide-react";

// Policy content, not social proof — ADR-041 explicitly carved this out
// as fair game ("Free delivery over ₹50,000" is a decision about how the
// business would operate, not an invented fact about it). Nothing here
// claims a customer count, a rating, or a company history.
const ITEMS = [
  {
    Icon: Truck,
    title: "Free Delivery",
    detail: "On all orders above ₹50,000",
  },
  {
    Icon: RotateCcw,
    title: "30-Day Returns",
    detail: "Hassle-free return policy",
  },
  {
    Icon: Wrench,
    title: "Expert Assembly",
    detail: "Professional setup at home",
  },
  {
    Icon: ShieldCheck,
    title: "Warranty Included",
    detail: "On every piece we ship",
  },
];

/**
 * Two placements, one list of items:
 *
 * - "band" (default) — the full-width strip near the bottom of the
 *   homepage, general reassurance after browsing.
 * - "compact" — a small boxed 2x2 grid on the product detail page,
 *   beside/below Add to Cart. Same information, but positioned where it
 *   actually answers a question the shopper has at that moment ("when
 *   does it arrive, can I return it?") rather than as a homepage banner.
 */
export default function TrustBar({ variant = "band" }) {
  if (variant === "compact") {
    return (
      <div className="mt-8 grid grid-cols-1 gap-4 rounded-xl border border-[#E7E5E4] bg-white/60 p-5 sm:grid-cols-2">
        {ITEMS.map(({ Icon, title, detail }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon size={18} className="mt-0.5 shrink-0 text-[#8B5E3C]" />
            <div>
              <p className="text-sm font-medium text-[#1C1917]">{title}</p>
              <p className="text-xs text-[#78716C]">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="border-y border-[#E7E5E4] bg-white/50">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-px px-6 py-10 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
        {ITEMS.map(({ Icon, title, detail }) => (
          <div
            key={title}
            className="flex flex-col items-center gap-2 px-4 text-center"
          >
            <Icon size={22} className="text-[#8B5E3C]" />
            <p className="text-sm font-medium text-[#1C1917]">{title}</p>
            <p className="text-xs text-[#78716C]">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
