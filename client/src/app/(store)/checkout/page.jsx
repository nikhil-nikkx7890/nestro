"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import clsx from "clsx";

import { useRequireCustomer } from "@/hooks/useRequireCustomer";
import { useCart } from "@/context/CartContext";
import { addressService } from "@/services/address.service";
import { orderService } from "@/services/order.service";
import { formatPaise, toTitleCase } from "@/utils/formatters";

export default function CheckoutPage() {
  const { ready } = useRequireCustomer();
  const router = useRouter();
  const { cart, loading: cartLoading, refetch: refetchCart } = useCart();

  const [addresses, setAddresses] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await addressService.list();
      setAddresses(res.data);
      const defaultAddress = res.data.find((a) => a.isDefault) || res.data[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      }
    } catch (error) {
      toast.error("Failed to load your addresses.");
    }
  }, []);

  // Category A (ADR-059): fetch-on-mount, same shape as CartContext's
  // own suppressed effect.
  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAddresses();
  }, [ready, fetchAddresses]);

  if (!ready || addresses === null || cartLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center text-[#78716C] sm:px-10">
        Loading...
      </div>
    );
  }

  const onPlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a shipping address.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await orderService.checkout(selectedAddressId);
      await refetchCart(); // the backend already cleared it; sync context state
      toast.success("Order placed successfully.");
      router.push(`/order-confirmation/${res.data._id}`);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to place your order. Please try again.";
      toast.error(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-10">
        <p className="text-[#78716C]">Your cart is empty — nothing to check out.</p>
        <Link
          href="/products"
          className="mt-4 inline-block text-sm font-medium text-[#8B5E3C] hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10">
      <h1 className="font-heading text-4xl text-[#1C1917]">Checkout</h1>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-[#E7E5E4] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl text-[#1C1917]">Shipping Address</h2>
              <Link
                href="/account/addresses"
                className="text-sm font-medium text-[#8B5E3C] hover:underline"
              >
                Add new address
              </Link>
            </div>

            {addresses.length === 0 ? (
              <p className="mt-4 text-sm text-[#78716C]">
                You don&apos;t have any saved addresses yet. Add one to continue.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address._id}
                    className={clsx(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                      selectedAddressId === address._id
                        ? "border-[#8B5E3C] bg-[#8B5E3C]/5"
                        : "border-[#E7E5E4] hover:border-[#D6D3D1]",
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address._id}
                      checked={selectedAddressId === address._id}
                      onChange={() => setSelectedAddressId(address._id)}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1C1917]">{address.fullName}</span>
                        <span className="rounded-full bg-[#F5F5F4] px-2 py-0.5 text-xs text-[#57534E]">
                          {address.addressType}
                        </span>
                      </div>
                      <p className="mt-1 text-[#44403C]">
                        {address.addressLine}
                        {address.landmark ? `, near ${address.landmark}` : ""}
                      </p>
                      <p className="text-[#44403C]">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p className="mt-1 text-[#78716C]">Phone: {address.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#E7E5E4] p-6">
            <h2 className="font-heading text-xl text-[#1C1917]">Order Items</h2>
            <div className="mt-4 space-y-4">
              {cart.items.map(({ variant, quantity }) => {
                const image = variant.images?.[0] || variant.product?.images?.[0];
                return (
                  <div key={variant._id} className="flex gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F5F5F4]">
                      {image?.url && (
                        <Image
                          src={image.url}
                          alt={variant.product?.name || ""}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1C1917]">
                          {toTitleCase(variant.product?.name || "")}
                        </p>
                        <p className="text-xs text-[#78716C]">
                          {variant.material?.name} &middot; {variant.color?.name} &middot; Qty{" "}
                          {quantity}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-[#1C1917]">
                        {formatPaise(variant.price * quantity)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-[#E7E5E4] p-6">
          <h2 className="font-heading text-xl text-[#1C1917]">Order Summary</h2>

          <div className="mt-4 space-y-2 text-sm text-[#57534E]">
            <div className="flex justify-between">
              <span>Subtotal ({cart.itemCount} items)</span>
              <span className="font-medium text-[#1C1917]">{formatPaise(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-medium text-[#1C1917]">Free</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-[#E7E5E4] pt-4 text-base font-semibold text-[#1C1917]">
            <span>Total</span>
            <span>{formatPaise(cart.subtotal)}</span>
          </div>

          <p className="mt-4 text-xs text-[#78716C]">
            Payment: Cash on Delivery — pay when your order arrives.
          </p>

          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={isPlacingOrder || addresses.length === 0 || !selectedAddressId}
            className="mt-6 w-full rounded-lg bg-[#8B5E3C] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#6E4A2F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPlacingOrder ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
