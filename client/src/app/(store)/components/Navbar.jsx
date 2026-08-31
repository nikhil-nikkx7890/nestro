"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, User } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

function IconLink({ href, count, label, children }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative text-[#5A5147] transition hover:text-[#B15E3B]"
    >
      {children}
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B15E3B] px-1 text-[10px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();

  const isCustomer = user?.role === "customer";

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/products");
  };

  return (
    <header className="border-b border-[#E7DFD3]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link
          href="/products"
          className="font-heading text-2xl font-semibold tracking-tight text-[#2B2621]"
        >
          Nestro
        </Link>

        <nav className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/products"
            className="text-sm font-medium text-[#5A5147] transition hover:text-[#B15E3B]"
          >
            Shop
          </Link>

          {isCustomer && (
            <IconLink href="/cart" label="Cart" count={cart.itemCount}>
              <ShoppingBag size={20} />
            </IconLink>
          )}

          {!loading && user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-medium text-[#5A5147] transition hover:text-[#B15E3B]"
            >
              <User size={18} />
              <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
            </Link>
          )}

          {isCustomer && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-[#5A5147] transition hover:text-[#B15E3B]"
            >
              Logout
            </button>
          )}

          {!loading && !user && (
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-[#5A5147] transition hover:text-[#B15E3B]"
            >
              <User size={18} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
