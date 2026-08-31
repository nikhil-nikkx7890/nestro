"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

import { useAuth } from "./AuthContext";
import { cartService } from "@/services/cart.service";

const CartContext = createContext(undefined);

const EMPTY_CART = { items: [], subtotal: 0, itemCount: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  // Cart is Customer-only (ADR-037) — an anonymous visitor or a logged-in
  // admin never has one, so skip the fetch entirely rather than let it 401/403.
  const isCustomer = user?.role === "customer";

  const refetch = useCallback(async () => {
    if (!isCustomer) {
      setCart(EMPTY_CART);
      return;
    }

    try {
      setLoading(true);
      const res = await cartService.get();
      setCart(res.data);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addItem = async (variantId, quantity = 1) => {
    const res = await cartService.addItem(variantId, quantity);
    setCart(res.data);
    return res;
  };

  const updateItem = async (variantId, quantity) => {
    const res = await cartService.updateItem(variantId, quantity);
    setCart(res.data);
    return res;
  };

  const removeItem = async (variantId) => {
    const res = await cartService.removeItem(variantId);
    setCart(res.data);
    return res;
  };

  return (
    <CartContext.Provider
      value={{ cart, loading, refetch, addItem, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
