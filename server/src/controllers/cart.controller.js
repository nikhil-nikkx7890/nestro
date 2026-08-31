import Cart from "../models/cart.model.js";
import ProductVariant from "../models/productVariant.model.js";
import AppError from "../utils/AppError.js";

/**
 * Fetches the user's cart, populated with each line item's *current*
 * variant/product/material/color data, and computes subtotal/itemCount.
 * Every cart-mutating handler below re-runs this after saving rather than
 * shaping the response from the pre-save document, so the response always
 * reflects live data (see the Cart decision in ADR-040 — no price/name
 * snapshot, unlike an Order line).
 */
const buildCartResponse = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.variant",
    populate: [
      { path: "material", select: "name" },
      { path: "color", select: "name hexCode" },
      { path: "product", select: "name slug images" },
    ],
  });

  // A variant referenced by a cart item can be deleted later (e.g. an
  // admin removes it) without the cart being cleaned up — populate leaves
  // item.variant null in that case. Those stale lines are dropped from the
  // response rather than crashing on item.variant.price; they stay in the
  // stored document until the customer's next successful mutation rewrites
  // cart.items.
  const items = (cart?.items ?? []).filter((item) => item.variant);

  const subtotal = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, subtotal, itemCount };
};

export const getCart = async (req, res) => {
  const data = await buildCartResponse(req.user._id);

  return res.status(200).json({
    success: true,
    data,
  });
};

export const addCartItem = async (req, res) => {
  const { variant: variantId, quantity } = req.body;

  const variant = await ProductVariant.findById(variantId);
  if (!variant) {
    throw new AppError("Product variant not found.", 404);
  }
  if (!variant.isActive) {
    throw new AppError("This product variant is no longer available.", 400);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find((item) => item.variant.toString() === variantId);
  const requestedQuantity = existingItem ? existingItem.quantity + quantity : quantity;

  if (requestedQuantity > variant.stock) {
    throw new AppError(`Only ${variant.stock} left in stock.`, 400);
  }

  if (existingItem) {
    existingItem.quantity = requestedQuantity;
  } else {
    cart.items.push({ variant: variantId, quantity });
  }

  await cart.save();

  return res.status(200).json({
    success: true,
    message: "Added to cart",
    data: await buildCartResponse(req.user._id),
  });
};

export const updateCartItem = async (req, res) => {
  const { variantId } = req.params;
  const { quantity } = req.body;

  const variant = await ProductVariant.findById(variantId);
  if (!variant) {
    throw new AppError("Product variant not found.", 404);
  }
  if (quantity > variant.stock) {
    throw new AppError(`Only ${variant.stock} left in stock.`, 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart?.items.find((i) => i.variant.toString() === variantId);

  if (!item) {
    throw new AppError("This item is not in your cart.", 404);
  }

  item.quantity = quantity;
  await cart.save();

  return res.status(200).json({
    success: true,
    message: "Cart updated",
    data: await buildCartResponse(req.user._id),
  });
};

export const removeCartItem = async (req, res) => {
  const { variantId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  const itemExists = cart?.items.some((i) => i.variant.toString() === variantId);

  if (!itemExists) {
    throw new AppError("This item is not in your cart.", 404);
  }

  cart.items = cart.items.filter((i) => i.variant.toString() !== variantId);
  await cart.save();

  return res.status(200).json({
    success: true,
    message: "Item removed from cart",
    data: await buildCartResponse(req.user._id),
  });
};
