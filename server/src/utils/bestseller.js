import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

/**
 * For a set of category ids, returns a Map<categoryId, bestsellerProductId>
 * — the product with the most units sold across Delivered orders, within
 * each category (ADR-068). Computed fresh on every call, no cache: the
 * same standard ADR-052 already applied to listing-card price/ratings —
 * simplest correct option at this project's scale, revisit only if it
 * becomes a measurable cost.
 *
 * A category with zero Delivered sales for any of its products simply has
 * no entry in the returned Map — callers treat "not the leader" and "no
 * leader yet" identically, which is correct: neither should show a badge.
 */
export const getBestsellerByCategory = async (categoryIds) => {
  if (!categoryIds.length) return new Map();

  // Order line items don't carry category (ADR-066's snapshot has no
  // reason to) — restricting to products that actually belong to one of
  // these categories up front, before touching Order at all, keeps the
  // aggregation below scoped to what the caller asked about instead of
  // joining every product in the catalog against every Delivered order.
  const productIdsInCategories = await Product.find({
    category: { $in: categoryIds },
  }).distinct("_id");

  if (!productIdsInCategories.length) return new Map();

  const rows = await Order.aggregate([
    // Matches on the un-unwound array first — cheap enough to skip most
    // Delivered orders outright before the more expensive per-item work
    // below ever runs.
    { $match: { status: "Delivered", "items.product": { $in: productIdsInCategories } } },
    { $unwind: "$items" },
    // Re-applied post-unwind: the order-level match above only proves an
    // order contains at least one qualifying item, not that every item in
    // it does — a mixed-category order would otherwise let an unrelated
    // line item's quantity count toward this total.
    { $match: { "items.product": { $in: productIdsInCategories } } },
    { $group: { _id: "$items.product", unitsSold: { $sum: "$items.quantity" } } },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    // _id as the tiebreaker makes a tie deterministic across repeated
    // calls (lowest ObjectId wins) rather than depending on Mongo's
    // unspecified tie-ordering, which could otherwise flip the badge
    // between two equally-sold products from one page load to the next.
    { $sort: { unitsSold: -1, _id: 1 } },
    {
      $group: {
        _id: "$product.category",
        bestsellerProduct: { $first: "$_id" },
      },
    },
  ]);

  return new Map(rows.map((row) => [String(row._id), String(row.bestsellerProduct)]));
};
