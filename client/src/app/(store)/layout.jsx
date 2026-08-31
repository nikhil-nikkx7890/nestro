import { Fraunces, Inter } from "next/font/google";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Serif for headings (product names, section titles), sans for body/UI
// chrome — the pairing ADR-038 calls for. The `variable` option sets a
// CSS custom property on this wrapper element rather than a global class,
// so the admin panel (a separate layout, never rendered inside this one)
// never picks these fonts up.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function StoreLayout({ children }) {
  return (
    <div
      className={`${fraunces.variable} ${inter.variable} min-h-screen bg-[#F7F2EA] font-store-sans text-[#2B2621]`}
    >
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
