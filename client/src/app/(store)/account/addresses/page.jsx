"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import clsx from "clsx";

import { useRequireCustomer } from "@/hooks/useRequireCustomer";
import { addressService } from "@/services/address.service";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { addressSchema } from "./schemas/address.schema";

const inputClasses = (hasError) =>
  clsx(
    "w-full rounded-xl border bg-white px-4 py-3 text-[#1C1917] outline-none transition",
    hasError ? "border-red-400" : "border-[#D6D3D1] focus:border-[#8B5E3C]",
  );

const emptyValues = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  addressType: "Home",
  landmark: "",
};

export default function AddressesPage() {
  const { ready } = useRequireCustomer();

  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // "list" | "form" — the form doubles as add and edit; editingAddress
  // null means "adding new", set means "editing this one" (same pattern
  // the login page uses for its Password/Email-code + request/verify
  // sub-states: one page, a small local state machine, no new routes).
  const [view, setView] = useState("list");
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Which address (if any) the delete-confirmation modal is open for.
  const [deletingAddress, setDeletingAddress] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: emptyValues,
  });

  // useCallback with a stable (empty) dependency list, the same shape as
  // CartContext's own `refetch` — needed so the effect below can list it
  // as a dependency without that dependency changing identity every
  // render and re-firing the fetch in a loop (the exact class of bug
  // FLOW 16.3/22.9 already document for this codebase).
  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await addressService.list();
      setAddresses(res.data);
    } catch (error) {
      toast.error("Failed to load your addresses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Category A (ADR-059): fetch-on-mount, the same shape as
  // CartContext/WishlistContext's own suppressed effects — there's no
  // rule-clean alternative to loading server state when the page mounts.
  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAddresses();
  }, [ready, fetchAddresses]);

  const openAddForm = () => {
    setEditingAddress(null);
    reset(emptyValues);
    setView("form");
  };

  const openEditForm = (address) => {
    setEditingAddress(address);
    reset({
      fullName: address.fullName,
      phone: address.phone,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      addressType: address.addressType,
      landmark: address.landmark || "",
    });
    setView("form");
  };

  const closeForm = () => {
    setView("list");
    setEditingAddress(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (editingAddress) {
        await addressService.update(editingAddress._id, data);
        toast.success("Address updated.");
      } else {
        await addressService.create(data);
        toast.success("Address added.");
      }
      closeForm();
      await fetchAddresses();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to save address. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSetDefault = async (address) => {
    setSettingDefaultId(address._id);
    try {
      await addressService.update(address._id, { isDefault: true });
      toast.success("Default address updated.");
      await fetchAddresses();
    } catch (error) {
      toast.error("Failed to set default address. Please try again.");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const onConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await addressService.remove(deletingAddress._id);
      toast.success("Address deleted.");
      setDeletingAddress(null);
      await fetchAddresses();
    } catch (error) {
      toast.error("Failed to delete address. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-[#78716C] sm:px-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8B5E3C]">Account</p>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-heading text-4xl text-[#1C1917]">Your Addresses</h1>
        <Link href="/account" className="text-sm font-medium text-[#8B5E3C] hover:underline">
          Back to profile
        </Link>
      </div>

      {view === "list" && (
        <div className="mt-10">
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-lg bg-[#8B5E3C] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#6E4A2F]"
          >
            + Add New Address
          </button>

          {isLoading && (
            <p className="mt-6 text-sm text-[#78716C]">Loading your addresses...</p>
          )}

          {!isLoading && addresses.length === 0 && (
            <div className="mt-6 rounded-2xl border border-[#E7E5E4] p-6 text-sm text-[#78716C]">
              You haven&apos;t saved any addresses yet.
            </div>
          )}

          <div className="mt-6 space-y-4">
            {addresses.map((address) => (
              <div
                key={address._id}
                className="rounded-2xl border border-[#E7E5E4] p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1C1917]">{address.fullName}</span>
                      <span className="rounded-full bg-[#F5F5F4] px-2.5 py-0.5 text-xs font-medium text-[#57534E]">
                        {address.addressType}
                      </span>
                      {address.isDefault && (
                        <span className="rounded-full bg-[#8B5E3C]/10 px-2.5 py-0.5 text-xs font-medium text-[#8B5E3C]">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[#44403C]">
                      {address.addressLine}
                      {address.landmark ? `, near ${address.landmark}` : ""}
                    </p>
                    <p className="text-sm text-[#44403C]">
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <p className="text-sm text-[#44403C]">{address.country}</p>
                    <p className="mt-2 text-sm text-[#78716C]">Phone: {address.phone}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-sm">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(address)}
                        className="font-medium text-[#8B5E3C] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAddress(address)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => onSetDefault(address)}
                        disabled={settingDefaultId === address._id}
                        className="text-[#78716C] hover:text-[#8B5E3C] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {settingDefaultId === address._id ? "Setting..." : "Set as default"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "form" && (
        <div className="mt-10 rounded-2xl border border-[#E7E5E4] p-6">
          <h2 className="font-heading text-xl text-[#1C1917]">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1C1917]">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register("fullName")}
                  className={inputClasses(!!errors.fullName)}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1C1917]">
                  Phone
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="10-digit mobile number"
                  className={inputClasses(!!errors.phone)}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1C1917]">
                Address Line
              </label>
              <input
                type="text"
                {...register("addressLine")}
                placeholder="House/flat no., street, area"
                className={inputClasses(!!errors.addressLine)}
              />
              {errors.addressLine && (
                <p className="mt-1 text-sm text-red-500">{errors.addressLine.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1C1917]">
                Landmark <span className="text-[#A8A29E]">(optional)</span>
              </label>
              <input
                type="text"
                {...register("landmark")}
                className={inputClasses(!!errors.landmark)}
              />
              {errors.landmark && (
                <p className="mt-1 text-sm text-red-500">{errors.landmark.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1C1917]">City</label>
                <input
                  type="text"
                  {...register("city")}
                  className={inputClasses(!!errors.city)}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1C1917]">State</label>
                <input
                  type="text"
                  {...register("state")}
                  className={inputClasses(!!errors.state)}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-500">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1C1917]">
                  Pincode
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  {...register("pincode")}
                  className={inputClasses(!!errors.pincode)}
                />
                {errors.pincode && (
                  <p className="mt-1 text-sm text-red-500">{errors.pincode.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1C1917]">
                  Country
                </label>
                <input
                  type="text"
                  {...register("country")}
                  className={inputClasses(!!errors.country)}
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-500">{errors.country.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1C1917]">
                Address Type
              </label>
              <div className="flex gap-3">
                {["Home", "Office", "Other"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 rounded-xl border border-[#D6D3D1] px-4 py-2 text-sm text-[#1C1917] has-[:checked]:border-[#8B5E3C] has-[:checked]:bg-[#8B5E3C]/5"
                  >
                    <input type="radio" value={type} {...register("addressType")} />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#8B5E3C] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#6E4A2F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : editingAddress ? "Save Changes" : "Add Address"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="rounded-lg border border-[#D6D3D1] px-8 py-3 text-sm font-medium text-[#1C1917] transition hover:bg-[#F5F5F4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!deletingAddress}
        onClose={() => setDeletingAddress(null)}
        onConfirm={onConfirmDelete}
        title="Delete this address?"
        message={
          deletingAddress
            ? `This removes "${deletingAddress.fullName} — ${deletingAddress.addressLine}" from your saved addresses.`
            : ""
        }
        isSubmitting={isDeleting}
      />
    </div>
  );
}
