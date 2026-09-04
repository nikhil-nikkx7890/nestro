"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, User } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

// The -m-2 p-2 pairing grows the tap area to ~40px without changing how
// the icon sits in the row — a bare 20px icon is well under the ~44px
// minimum a finger can reliably hit on a phone.
function IconLink({ href, count, label, children }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative -m-2 p-2 text-[#57534E] transition hover:text-[#8B5E3C]"
    >
      {children}
      {count > 0 && (
        <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8B5E3C] px-1 text-[10px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { cart } = useCart();
  const { products: wishlistProducts } = useWishlist();
  const router = useRouter();

  const isCustomer = user?.role === "customer";

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/products");
  };

  return (
    <header className="border-b border-[#E7E5E4]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-6 sm:px-10">
        <Link
          href="/"
          className="font-heading text-2xl font-semibold tracking-tight text-[#1C1917]"
        >
          Nestro
        </Link>

        <nav className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/products"
            className="text-sm font-medium text-[#57534E] transition hover:text-[#8B5E3C]"
          >
            Shop
          </Link>

          <Link
            href="/about"
            className="hidden text-sm font-medium text-[#57534E] transition hover:text-[#8B5E3C] sm:inline"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="hidden text-sm font-medium text-[#57534E] transition hover:text-[#8B5E3C] sm:inline"
          >
            Contact
          </Link>

          {/* Always visible, even signed out — a store with no cart icon
              until you log in doesn't read as a store. Both pages already
              handle the logged-out case by prompting for login, so the
              icons point there and the counts simply render as zero. */}
          <IconLink
            href={isCustomer ? "/wishlist" : "/login"}
            label="Wishlist"
            count={isCustomer ? wishlistProducts.length : 0}
          >
            <Heart size={20} />
          </IconLink>
          <IconLink
            href={isCustomer ? "/cart" : "/login"}
            label="Cart"
            count={isCustomer ? cart.itemCount : 0}
          >
            <ShoppingBag size={20} />
          </IconLink>

          {isCustomer && (
            <Link
              href="/account"
              className="-m-2 flex items-center gap-2 p-2 text-sm font-medium text-[#57534E] transition hover:text-[#8B5E3C]"
            >
              <User size={18} />
              <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
            </Link>
          )}

          {!loading && user?.role === "admin" && (
            <Link
              href="/admin"
              className="-m-2 flex items-center gap-2 p-2 text-sm font-medium text-[#57534E] transition hover:text-[#8B5E3C]"
            >
              <User size={18} />
              <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
            </Link>
          )}

          {isCustomer && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-[#57534E] transition hover:text-[#8B5E3C]"
            >
              Logout
            </button>
          )}

          {!loading && !user && (
            <Link
              href="/login"
              className="-m-2 flex items-center gap-2 p-2 text-sm font-medium text-[#57534E] transition hover:text-[#8B5E3C]"
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
