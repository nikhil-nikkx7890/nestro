import { Inter } from "next/font/google";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// One family (Inter) for both headings and body — italic weight carries
// emphasis instead of a second serif face. The `variable` option sets a
// CSS custom property on this wrapper element rather than a global class,
// so the admin panel (a separate layout, never rendered inside this one)
// never picks it up.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function StoreLayout({ children }) {
  return (
    <div
      className={`${inter.variable} min-h-screen bg-[#F8F5F1] font-store-sans text-[#1C1917]`}
    >
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
