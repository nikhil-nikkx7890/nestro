"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

import { useAuth } from "./AuthContext";
import { wishlistService } from "@/services/wishlist.service";

const WishlistContext = createContext(undefined);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const isCustomer = user?.role === "customer";

  const refetch = useCallback(async () => {
    if (!isCustomer) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      const res = await wishlistService.get();
      setProducts(res.data.products);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  // Category A (ADR-059): same shape as CartContext — the wishlist is
  // server state that has to be fetched before it can be rendered, and
  // `refetch` writes the result into React state. Nothing to restructure
  // here short of moving fetching out of effects entirely.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const addItem = async (productId) => {
    const res = await wishlistService.addItem(productId);
    setProducts(res.data.products);
    return res;
  };

  const removeItem = async (productId) => {
    const res = await wishlistService.removeItem(productId);
    setProducts(res.data.products);
    return res;
  };

  const isWishlisted = (productId) => products.some((p) => p._id === productId);

  return (
    <WishlistContext.Provider
      value={{ products, loading, refetch, addItem, removeItem, isWishlisted }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }

  return context;
}
