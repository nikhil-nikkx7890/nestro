export default function Footer() {
  return (
    <footer className="border-t border-[#E7DFD3] bg-[#F1EAE0]">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <p className="font-heading text-xl font-semibold text-[#2B2621]">
          Nestro
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5A5147]">
          Furniture built for how you actually live — considered materials,
          honest craftsmanship, made to stay.
        </p>
        <p className="mt-8 text-xs text-[#8A8071]">
          &copy; {new Date().getFullYear()} Nestro. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
