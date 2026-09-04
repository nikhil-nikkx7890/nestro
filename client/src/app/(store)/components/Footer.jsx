import Link from "next/link";

import NewsletterForm from "./NewsletterForm";

// Only links that actually resolve to a built page are listed. A footer
// full of dead links ("Careers", "Track Order", "Sitemap") looks fuller
// but every one of them is a 404 — the same honesty rule ADR-041 applies
// to content, applied to navigation.
const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Furniture", href: "/products" },
      { label: "Cart", href: "/cart" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Create Account", href: "/register" },
      { label: "My Account", href: "/account" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-stone-950">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-10 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-heading text-xl font-semibold text-white">Nestro</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-400">
              Furniture built for how you actually live — considered materials,
              honest craftsmanship, made to stay.
            </p>

            {/* No social icon row: Nestro has no accounts to link to, and
                icons pointing at href="#" are worse than none at all. */}
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#D6BFA7]">
                {column.title}
              </p>
              <ul className="mt-4 space-y-3 text-sm text-stone-400">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-[#D6BFA7]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 border-t border-stone-800 pt-8">
          <NewsletterForm />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-stone-800 pt-8 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Nestro. All rights reserved.</p>
          <p className="max-w-lg text-stone-500">
            Nestro is a portfolio project, not a real store. The catalog,
            reviews and accounts are demo data, and nothing here can actually
            be purchased.
          </p>
        </div>
      </div>
    </footer>
  );
}
