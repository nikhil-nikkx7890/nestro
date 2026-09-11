import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Address from "../models/address.model.js";
import ProductVariant from "../models/productVariant.model.js";
import AppError from "../utils/AppError.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";

// Only these three stages allow a cancel — from the customer (cancelOrder)
// or an equivalent admin action (updateOrderStatus) — matching ADR-066's
// own physical-world line: once a box is Shipped, it's no longer "still
// ours to stop." Admin doesn't get a wider window than the customer does;
// cancelling is the same action either way, just possibly done on the
// customer's behalf.
const CANCELLABLE_FROM = ["Pending", "Confirmed", "Processing"];

// The six-stage main sequence a status can only ever move forward through
// one step at a time (ADR-066: "not a shortened version") — Cancelled and
// Returned are handled as separate branches below, not positions in this
// array.
const FORWARD_SEQUENCE = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
];

/**
 * Whether `to` is a legal next status from `from`. Three shapes:
 *  - Cancelled: only from the same early stages a customer could cancel
 *    from themselves.
 *  - Returned: only from Delivered — a return is only meaningful once
 *    the goods actually arrived.
 *  - Anything else: exactly one step forward along FORWARD_SEQUENCE. No
 *    skipping stages, no moving backward.
 */
const isValidStatusTransition = (from, to) => {
  if (to === "Cancelled") return CANCELLABLE_FROM.includes(from);
  if (to === "Returned") return from === "Delivered";

  const fromIndex = FORWARD_SEQUENCE.indexOf(from);
  const toIndex = FORWARD_SEQUENCE.indexOf(to);
  return fromIndex !== -1 && toIndex === fromIndex + 1;
};

/**
 * Restores stock for every line in an order — the exact inverse of
 * checkout's decrement, used by both cancelOrder and updateOrderStatus
 * (Cancelled/Returned). A plain per-variant $inc, not a conditional
 * update: there is no stock floor to respect when giving stock back, only
 * when taking it (checkout's findOneAndUpdate does that side).
 */
const restockOrderItems = async (items) => {
  await Promise.all(
    items.map((item) =>
      ProductVariant.updateOne({ _id: item.variant }, { $inc: { stock: item.quantity } }),
    ),
  );
};

/**
 * POST /api/checkout. Snapshots the cart and the selected address into a
 * new Order, decrements stock, and clears the cart — all as one
 * best-effort unit without a Mongo transaction (this app has none set up
 * anywhere else, including Address's own concurrent-write case in
 * ADR-065; see ADR-066's implementation notes for why one wasn't added
 * here either — mongodb-memory-server's default standalone mode used by
 * the whole Jest suite doesn't support them).
 *
 * Correctness without a transaction rests on two things: (1) each stock
 * decrement is individually atomic — a single conditional
 * findOneAndUpdate, not a read-then-write — so two simultaneous
 * checkouts can never both succeed against the same last unit; (2) if a
 * later item in this order fails after earlier ones already decremented,
 * every already-decremented item is restocked before the error is
 * thrown, so a failed checkout never leaves stock silently short.
 */
export const checkout = async (req, res) => {
  const { addressId } = req.body;

  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) {
    // Same 404-not-403 reasoning as ADR-065's own address ownership
    // check — "doesn't exist" and "isn't yours" read identically.
    throw new AppError("Address not found.", 404);
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.variant",
    populate: [
      { path: "material", select: "name" },
      { path: "color", select: "name" },
      { path: "product", select: "name images" },
    ],
  });

  // Same "drop stale lines where the variant was deleted out from under
  // the cart" rule buildCartResponse already applies (cart.controller.js)
  // — a line that can't be priced or stocked can't be checked out either.
  const validItems = (cart?.items ?? []).filter((item) => item.variant);
  if (validItems.length === 0) {
    throw new AppError("Your cart is empty.", 400);
  }

  const lineItems = validItems.map((item) => ({
    variant: item.variant._id,
    product: item.variant.product._id,
    name: item.variant.product.name,
    sku: item.variant.sku,
    image: item.variant.images?.[0]?.url || item.variant.product.images?.[0]?.url || "",
    material: item.variant.material?.name || "",
    color: item.variant.color?.name || "",
    price: item.variant.price,
    quantity: item.quantity,
  }));

  const decremented = [];
  try {
    for (const item of lineItems) {
      // The conditional update IS the atomicity: stock only decrements
      // if it's still >= quantity at the moment MongoDB applies this
      // write, not at the moment this function read it earlier — two
      // requests racing for the last unit can't both succeed.
      const updated = await ProductVariant.findOneAndUpdate(
        { _id: item.variant, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
      );

      if (!updated) {
        throw new AppError(
          `"${item.name}" (${[item.material, item.color].filter(Boolean).join(" / ")}) no longer has enough stock. Please update your cart.`,
          409,
        );
      }
      decremented.push(item);
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = 0;

    const order = await Order.create({
      user: req.user._id,
      items: lineItems,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        addressType: address.addressType,
        landmark: address.landmark,
      },
      paymentMethod: "COD",
      status: "Pending",
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
    });

    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: order,
    });
  } catch (err) {
    // Whatever already succeeded — one or more decrements, possibly the
    // Order document itself if cart.save() is what actually failed —
    // gets unwound before the error propagates. Order.create() failing
    // after decrements is the one edge this specifically guards: without
    // this, a validation failure on the Order write would leave stock
    // silently short with no order to show for it.
    if (decremented.length > 0) {
      await restockOrderItems(decremented);
    }
    throw err;
  }
};

/**
 * GET /api/orders. One route, role-branched — the same shape
 * getProducts already uses for optionalAuthenticate (admin sees
 * everything, everyone else sees their own scope), rather than a
 * separate admin-only path for what's conceptually the same list.
 */
export const getOrders = async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
    sortableFields: ["createdAt", "total", "status"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  if (req.user.role !== "admin") {
    filter.user = req.user._id;
  }

  // Admin-only filter — a customer's own order list is already scoped to
  // them, so a status filter there would just be a client-side concern.
  if (req.user.role === "admin" && req.query.status) {
    filter.status = req.query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit).populate("user", "name email"),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * GET /api/orders/:id. Same ownership shape as Address (ADR-065): a
 * customer requesting another customer's order id gets 404, not 403 —
 * an order is at least as private as an address (it contains one).
 * Admin bypasses the ownership check entirely.
 */
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id).populate("user", "name email");
  if (!order) {
    throw new AppError("Order not found.", 404);
  }
  if (req.user.role !== "admin" && String(order.user._id) !== String(req.user._id)) {
    throw new AppError("Order not found.", 404);
  }

  return res.status(200).json({
    success: true,
    data: order,
  });
};

/**
 * POST /api/orders/:id/cancel. Customer-only, own order only, and only
 * inside the cancellable window (ADR-066) — restocks every line on
 * success, the exact inverse of checkout's decrement.
 */
export const cancelOrder = async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, user: req.user._id });
  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  if (!CANCELLABLE_FROM.includes(order.status)) {
    throw new AppError(
      `This order can no longer be cancelled — it's already ${order.status}.`,
      400,
    );
  }

  order.status = "Cancelled";
  await order.save();
  await restockOrderItems(order.items);

  return res.status(200).json({
    success: true,
    message: "Order cancelled.",
    data: order,
  });
};

/**
 * PATCH /api/orders/:id/status. Admin-only. Rejects any transition
 * isValidStatusTransition doesn't allow — no skipping stages, no moving
 * backward, Cancelled/Returned only from the states that make sense for
 * each. Restocks on the two branches that mean "these items are coming
 * back," same as cancelOrder.
 */
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status: nextStatus } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  if (!isValidStatusTransition(order.status, nextStatus)) {
    throw new AppError(
      `Cannot move an order from ${order.status} to ${nextStatus}.`,
      400,
    );
  }

  order.status = nextStatus;
  await order.save();

  if (nextStatus === "Cancelled" || nextStatus === "Returned") {
    await restockOrderItems(order.items);
  }

  return res.status(200).json({
    success: true,
    message: `Order marked ${nextStatus}.`,
    data: order,
  });
};
