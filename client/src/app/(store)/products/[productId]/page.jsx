"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { productService } from "@/services/product.service";
import { variantService } from "@/services/variant.service";
import { toTitleCase, formatPaise } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

import VariantPicker from "./components/VariantPicker";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem: addCartItem } = useCart();
  const { isWishlisted, addItem: addWishlistItem, removeItem: removeWishlistItem } =
    useWishlist();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const [productRes, variantRes] = await Promise.all([
          productService.getById(productId),
          variantService.list(productId, { limit: 100 }),
        ]);

        // Only variants still available for purchase are offered here —
        // an admin needs to see a deactivated variant to manage it, a
        // shopper never should (isActive is the "retire without removing"
        // flag, ADR-024).
        const activeVariants = variantRes.data.filter((v) => v.isActive);

        setProduct(productRes.data);
        setVariants(activeVariants);
        setSelectedVariant(activeVariants[0] ?? null);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const isCustomer = user?.role === "customer";

  const requireCustomerLogin = () => {
    toast.error("Please log in to continue.");
    router.push("/login");
  };

  const handleAddToCart = async () => {
    if (!isCustomer) {
      requireCustomerLogin();
      return;
    }
    if (!selectedVariant) return;

    try {
      setIsAddingToCart(true);
      await addCartItem(selectedVariant._id, quantity);
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add to cart.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isCustomer) {
      requireCustomerLogin();
      return;
    }

    try {
      setIsTogglingWishlist(true);
      if (isWishlisted(productId)) {
        await removeWishlistItem(productId);
      } else {
        await addWishlistItem(productId);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update wishlist.");
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-24 text-center text-[#78716C] sm:px-10">
        Loading...
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-24 text-center sm:px-10">
        <h1 className="font-heading text-3xl text-[#1C1917]">
          Product not found
        </h1>
        <p className="mt-3 text-[#78716C]">
          This product may be unavailable or no longer exists.
        </p>
      </div>
    );
  }

  const gallery = selectedVariant?.images?.length
    ? selectedVariant.images
    : product.images;
  const displayImage = gallery?.[activeImage] ?? gallery?.[0];

  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;
  const isLowStock =
    selectedVariant &&
    selectedVariant.stock > 0 &&
    selectedVariant.stock <= selectedVariant.lowStockThreshold;

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-14 sm:px-10">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F5F5F4]">
            {displayImage?.url ? (
              <Image
                src={displayImage.url}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[#A8A29E]">
                No image
              </div>
            )}
          </div>

          {gallery?.length > 1 && (
            <div className="mt-4 flex gap-3">
              {gallery.map((img, index) => (
                <button
                  key={img.publicId || index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                    index === activeImage
                      ? "border-[#8B5E3C]"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} view ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category?.name && (
            <p className="text-xs uppercase tracking-wide text-[#8B5E3C]">
              {product.category.name}
            </p>
          )}

          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="font-heading text-4xl text-[#1C1917]">
              {toTitleCase(product.name)}
            </h1>

            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={isTogglingWishlist}
              aria-label={
                isWishlisted(productId) ? "Remove from wishlist" : "Add to wishlist"
              }
              className="mt-1 shrink-0 text-[#8B5E3C] transition disabled:opacity-40"
            >
              <Heart
                size={26}
                fill={isWishlisted(productId) ? "currentColor" : "none"}
              />
            </button>
          </div>

          {product.brand?.name && (
            <p className="mt-2 text-[#78716C]">{product.brand.name}</p>
          )}

          {selectedVariant && (
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-[#1C1917]">
                {formatPaise(selectedVariant.price)}
              </span>
              {selectedVariant.compareAtPrice && (
                <span className="text-lg text-[#A8A29E] line-through">
                  {formatPaise(selectedVariant.compareAtPrice)}
                </span>
              )}
            </div>
          )}

          {selectedVariant && (
            <p
              className={`mt-2 text-sm ${
                isOutOfStock
                  ? "text-red-600"
                  : isLowStock
                    ? "text-amber-600"
                    : "text-[#57534E]"
              }`}
            >
              {isOutOfStock
                ? "Out of stock"
                : isLowStock
                  ? `Only ${selectedVariant.stock} left`
                  : "In stock"}
            </p>
          )}

          {selectedVariant && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-full border border-[#D6D3D1] px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="p-1 text-[#57534E] disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-4 text-center text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(selectedVariant.stock, q + 1))
                  }
                  disabled={quantity >= selectedVariant.stock}
                  className="p-1 text-[#57534E] disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
                className="flex-1 rounded-lg bg-[#8B5E3C] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#6E4A2F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isOutOfStock
                  ? "Out of Stock"
                  : isAddingToCart
                    ? "Adding..."
                    : "Add to Cart"}
              </button>
            </div>
          )}

          {product.description && (
            <p className="mt-6 leading-relaxed text-[#57534E]">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <VariantPicker
              variants={variants}
              selectedVariant={selectedVariant}
              onSelect={(variant) => {
                setSelectedVariant(variant);
                setActiveImage(0);
                setQuantity(1);
              }}
            />
          </div>

          {(product.specifications?.length > 0 || selectedVariant?.dimensions?.length) && (
            <div className="mt-10 border-t border-[#E7E5E4] pt-8">
              <h2 className="font-heading text-xl text-[#1C1917]">
                Specifications
              </h2>
              <dl className="mt-4 space-y-3">
                {selectedVariant?.dimensions?.length && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-[#78716C]">Dimensions (L x W x H)</dt>
                    <dd className="text-[#1C1917]">
                      {selectedVariant.dimensions.length} x {selectedVariant.dimensions.width} x{" "}
                      {selectedVariant.dimensions.height} {selectedVariant.dimensions.unit}
                    </dd>
                  </div>
                )}
                {selectedVariant?.weight?.value && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-[#78716C]">Weight</dt>
                    <dd className="text-[#1C1917]">
                      {selectedVariant.weight.value} {selectedVariant.weight.unit}
                    </dd>
                  </div>
                )}
                {product.specifications?.map((spec, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <dt className="text-[#78716C]">{spec.key}</dt>
                    <dd className="text-[#1C1917]">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
