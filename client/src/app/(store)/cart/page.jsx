"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { useRequireCustomer } from "@/hooks/useRequireCustomer";
import { useCart } from "@/context/CartContext";
import { toTitleCase, formatPaise } from "@/utils/formatters";

export default function CartPage() {
  const { ready } = useRequireCustomer();
  const { cart, updateItem, removeItem } = useCart();
  const [pendingVariantId, setPendingVariantId] = useState(null);

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center text-[#78716C] sm:px-10">
        Loading...
      </div>
    );
  }

  const changeQuantity = async (variantId, nextQuantity, stock) => {
    if (nextQuantity < 1 || nextQuantity > stock) return;

    try {
      setPendingVariantId(variantId);
      await updateItem(variantId, nextQuantity);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update quantity.");
    } finally {
      setPendingVariantId(null);
    }
  };

  const remove = async (variantId) => {
    try {
      setPendingVariantId(variantId);
      await removeItem(variantId);
      toast.success("Removed from cart.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove item.");
    } finally {
      setPendingVariantId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10">
      <h1 className="font-heading text-4xl text-[#1C1917]">Your Cart</h1>

      {cart.items.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-[#78716C]">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-[#8B5E3C] hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {cart.items.map(({ variant, quantity }) => {
              const image = variant.images?.[0] || variant.product?.images?.[0];
              const isPending = pendingVariantId === variant._id;

              return (
                <div
                  key={variant._id}
                  className="flex gap-4 border-b border-[#E7E5E4] pb-6"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F5F5F4]">
                    {image?.url && (
                      <Image
                        src={image.url}
                        alt={variant.product?.name || ""}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-heading text-lg text-[#1C1917]">
                        {toTitleCase(variant.product?.name || "")}
                      </h3>
                      <p className="text-sm text-[#78716C]">
                        {variant.material?.name} &middot; {variant.color?.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-full border border-[#D6D3D1] px-2 py-1">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            changeQuantity(variant._id, quantity - 1, variant.stock)
                          }
                          className="p-1 text-[#57534E] disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-sm">{quantity}</span>
                        <button
                          type="button"
                          disabled={isPending || quantity >= variant.stock}
                          onClick={() =>
                            changeQuantity(variant._id, quantity + 1, variant.stock)
                          }
                          className="p-1 text-[#57534E] disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-medium text-[#1C1917]">
                          {formatPaise(variant.price * quantity)}
                        </span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => remove(variant._id)}
                          aria-label="Remove item"
                          className="text-[#78716C] transition hover:text-red-600 disabled:opacity-40"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-fit rounded-2xl border border-[#E7E5E4] p-6">
            <h2 className="font-heading text-xl text-[#1C1917]">Summary</h2>
            <div className="mt-4 flex justify-between text-sm text-[#57534E]">
              <span>Subtotal ({cart.itemCount} items)</span>
              <span className="font-medium text-[#1C1917]">
                {formatPaise(cart.subtotal)}
              </span>
            </div>
            <p className="mt-4 text-xs text-[#78716C]">
              Checkout isn&apos;t available yet — this is a preview of your cart.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
