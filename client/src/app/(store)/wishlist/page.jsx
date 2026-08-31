"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useRequireCustomer } from "@/hooks/useRequireCustomer";
import { useWishlist } from "@/context/WishlistContext";

import ProductCard from "../products/components/ProductCard";

export default function WishlistPage() {
  const { ready } = useRequireCustomer();
  const { products, removeItem } = useWishlist();
  const [pendingId, setPendingId] = useState(null);

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-center text-[#8A8071] sm:px-10">
        Loading...
      </div>
    );
  }

  const remove = async (productId) => {
    try {
      setPendingId(productId);
      await removeItem(productId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove item.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
      <h1 className="font-heading text-4xl text-[#2B2621]">Your Wishlist</h1>

      {products.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-[#8A8071]">Nothing saved yet.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-[#B15E3B] hover:underline"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product._id} className="relative">
              <button
                type="button"
                disabled={pendingId === product._id}
                onClick={() => remove(product._id)}
                aria-label="Remove from wishlist"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B15E3B] shadow-sm transition hover:bg-white disabled:opacity-40"
              >
                <Heart size={16} fill="currentColor" />
              </button>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
