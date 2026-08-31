import Wishlist from "../models/wishlist.model.js";
import Product from "../models/product.model.js";
import AppError from "../utils/AppError.js";

const POPULATE_FIELDS = "name slug images status";

export const getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
    "products",
    POPULATE_FIELDS,
  );

  // Same reasoning as Cart — a wishlisted product can be deleted later
  // without the wishlist being cleaned up; populate leaves a null entry
  // for a missing ref, so it's filtered out of the response rather than
  // shown as a broken card.
  const products = (wishlist?.products ?? []).filter(Boolean);

  return res.status(200).json({
    success: true,
    data: { products },
  });
};

export const addWishlistItem = async (req, res) => {
  const { product: productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found.", 404);
  }

  // $addToSet is naturally idempotent — wishlisting an already-wishlisted
  // product is a no-op, not a duplicate-key error to handle.
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: productId } },
    { upsert: true, returnDocument: "after" },
  ).populate("products", POPULATE_FIELDS);

  return res.status(200).json({
    success: true,
    message: "Added to wishlist",
    data: { products: wishlist.products.filter(Boolean) },
  });
};

export const removeWishlistItem = async (req, res) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: productId } },
    { returnDocument: "after" },
  ).populate("products", POPULATE_FIELDS);

  return res.status(200).json({
    success: true,
    message: "Removed from wishlist",
    data: { products: wishlist?.products.filter(Boolean) ?? [] },
  });
};
