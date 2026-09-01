import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-stone-950">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-10 px-6 py-12 sm:flex-row sm:px-10">
        <div>
          <p className="font-heading text-xl font-semibold text-white">
            Nestro
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-400">
            Furniture built for how you actually live — considered materials,
            honest craftsmanship, made to stay.
          </p>
          <p className="mt-8 text-xs text-stone-500">
            &copy; {new Date().getFullYear()} Nestro. All rights reserved.
          </p>
        </div>

        <nav className="flex gap-x-10 gap-y-3 text-sm text-stone-400 sm:flex-col">
          <Link href="/products" className="transition hover:text-[#D6BFA7]">
            Shop
          </Link>
          <Link href="/about" className="transition hover:text-[#D6BFA7]">
            About
          </Link>
          <Link href="/contact" className="transition hover:text-[#D6BFA7]">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
