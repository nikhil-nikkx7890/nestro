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

  useEffect(() => {
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
