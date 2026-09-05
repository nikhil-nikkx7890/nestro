import mongoose from "mongoose";
import Product from "../models/product.model.js";
import ProductVariant from "../models/productVariant.model.js";
import Review from "../models/review.model.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import RoomType from "../models/roomType.model.js";
import Material from "../models/material.model.js";
import Color from "../models/color.model.js";
import AppError from "../utils/AppError.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";
import { getReviewSummary } from "./review.controller.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

// A filter query param may now carry more than one id, comma-separated
// (e.g. ?material=id1,id2) — this is the multi-select generalization of
// ADR-040's original single-value filters (ADR-048).
const parseIdList = (value) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(isValidObjectId);
};

// Guards against the empty-string coercion bug already fixed once
// elsewhere in this app (Number("") === 0, which would wrongly become a
// real $gte:0 constraint) — an absent or blank price param must mean
// "no constraint", not "zero".
const parsePrice = (value) => {
  if (value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
};

/**
 * Confirms that category, brand, and every roomTypes id in the payload
 * point to real, existing documents. Throws 400 naming whichever is missing.
 */
const assertReferencesExist = async ({ category, brand, roomTypes }) => {
  const [categoryDoc, brandDoc, roomTypeCount] = await Promise.all([
    Category.exists({ _id: category }),
    Brand.exists({ _id: brand }),
    RoomType.countDocuments({ _id: { $in: roomTypes } }),
  ]);

  if (!categoryDoc) {
    throw new AppError("Category not found.", 400);
  }
  if (!brandDoc) {
    throw new AppError("Brand not found.", 400);
  }
  if (roomTypeCount !== roomTypes.length) {
    throw new AppError("One or more room types not found.", 400);
  }
};

export const createProduct = async (req, res) => {
  const { name, description, category, brand, roomTypes, images, specifications, seo, status } =
    req.body;

  await assertReferencesExist({ category, brand, roomTypes });

  const product = await Product.create({
    name,
    description,
    category,
    brand,
    roomTypes,
    images,
    specifications,
    seo,
    status,
  });

  await product.populate([
    { path: "category", select: "name slug" },
    { path: "brand", select: "name slug" },
    { path: "roomTypes", select: "name slug" },
    { path: "variantCount" },
  ]);

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
};

export const getProducts = async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
    sortableFields: ["name", "createdAt", "status"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  // Anonymous and non-admin callers only ever see published products,
  // regardless of any status-shaped value the request supplies — the
  // safe default is what happens when nothing is specified (ADR-036).
  if (req.user?.role !== "admin") {
    filter.status = "published";
  }

  // Category, Brand, and RoomType all live directly on Product, so they
  // filter the same way status does — RoomType is an array field, but
  // Mongo's $in against an array field already matches "any element is in
  // this list" natively, no special handling needed. Material and Color
  // live on ProductVariant (ADR-005), so a Product only matches if it has
  // at least one active variant satisfying every selected material/color
  // constraint together — the same combined-variant contract ADR-040
  // established for a single value each, generalized to $in (ADR-048).
  const { category, brand, roomType, material, color, minPrice, maxPrice, inStock } = req.query;

  const categoryIds = parseIdList(category);
  const brandIds = parseIdList(brand);
  const roomTypeIds = parseIdList(roomType);
  const materialIds = parseIdList(material);
  const colorIds = parseIdList(color);

  if (categoryIds.length) filter.category = { $in: categoryIds };
  if (brandIds.length) filter.brand = { $in: brandIds };
  if (roomTypeIds.length) filter.roomTypes = { $in: roomTypeIds };

  // Each facet below (material/color, price range, in-stock) is
  // independent — a product matches if ANY of its active variants
  // satisfies each facet on its own, not necessarily the same variant
  // across facets (ADR-048). Every facet contributes its own distinct
  // list of matching product ids; the product must appear in all of
  // them, so we intersect whichever facets were actually requested.
  const facetProductIdLists = [];

  if (materialIds.length || colorIds.length) {
    // isActive: only a variant a shopper could actually buy counts as a
    // match — a product whose only matching variant was retired
    // (ADR-024's "deactivate, don't delete") shouldn't surface for a
    // filter implying that option is available.
    const variantMatch = { isActive: true };
    if (materialIds.length) variantMatch.material = { $in: materialIds };
    if (colorIds.length) variantMatch.color = { $in: colorIds };
    facetProductIdLists.push(await ProductVariant.distinct("product", variantMatch));
  }

  const min = parsePrice(minPrice);
  const max = parsePrice(maxPrice);
  if (min !== undefined || max !== undefined) {
    const priceMatch = { isActive: true, price: {} };
    if (min !== undefined) priceMatch.price.$gte = min;
    if (max !== undefined) priceMatch.price.$lte = max;
    facetProductIdLists.push(await ProductVariant.distinct("product", priceMatch));
  }

  if (inStock === "true") {
    facetProductIdLists.push(
      await ProductVariant.distinct("product", { isActive: true, stock: { $gt: 0 } }),
    );
  }

  if (facetProductIdLists.length) {
    const [first, ...rest] = facetProductIdLists.map((list) => new Set(list.map(String)));
    const intersected = [...first].filter((id) => rest.every((set) => set.has(id)));
    filter._id = { $in: intersected };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .populate("roomTypes", "name slug")
      .populate("variantCount"),
    Product.countDocuments(filter),
  ]);

  // One aggregation for the whole page, not one query per product — a
  // listing card needs a "from ₹X" price and a real discount badge, but
  // ADR-039 deliberately left price off the card originally specifically
  // to avoid an N+1 fetch. Grouping across the page's product ids in a
  // single ProductVariant query keeps that guarantee: always exactly one
  // extra query, regardless of page size.
  const productIds = products.map((p) => p._id);
  const [priceRows, ratingRows] = await Promise.all([
    ProductVariant.aggregate([
      { $match: { product: { $in: productIds }, isActive: true } },
      {
        $group: {
          _id: "$product",
          minPrice: { $min: "$price" },
          maxCompareAtPrice: { $max: "$compareAtPrice" },
        },
      },
    ]),
    // Same one-query-per-page rule as pricing above: ratings are computed
    // from the Review collection rather than stored on Product, so they
    // can never drift out of sync with the reviews people actually wrote.
    Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const priceByProduct = new Map(priceRows.map((r) => [String(r._id), r]));
  const ratingByProduct = new Map(ratingRows.map((r) => [String(r._id), r]));

  const productsWithPricing = products.map((product) => {
    const pricing = priceByProduct.get(String(product._id));
    const rating = ratingByProduct.get(String(product._id));
    return {
      ...product.toObject(),
      fromPrice: pricing?.minPrice ?? null,
      compareAtPrice: pricing?.maxCompareAtPrice ?? null,
      averageRating: rating ? Number(rating.averageRating.toFixed(2)) : null,
      reviewCount: rating?.reviewCount ?? 0,
    };
  });

  return res.status(200).json({
    success: true,
    data: productsWithPricing,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Powers the storefront's filter sidebar (ADR-048): every active
 * Category/Brand/RoomType/Material/Color, each with a real, computed count
 * of published products — never an invented number (ADR-041's rule
 * applies here too, even though it's a filter count rather than a
 * marketing stat).
 *
 * Deliberately static counts, not dynamic per-facet recomputation — each
 * count answers "how many published products match this option on its
 * own", not "how many would match if today's other checked filters also
 * applied". A fully dynamic faceted count (recomputed per combination of
 * active filters) is real aggregation-pipeline work with its own
 * complexity budget; static counts are the right scope for what a
 * filter sidebar needs today, consistent with ADR-002's delayed-
 * refactoring principle. Revisit if the static/dynamic mismatch actually
 * confuses shoppers in practice.
 */
export const getProductFilterOptions = async (req, res) => {
  const [
    categories,
    brands,
    roomTypes,
    materials,
    colors,
    categoryCounts,
    brandCounts,
    roomTypeCounts,
    materialCounts,
    colorCounts,
  ] = await Promise.all([
    Category.find({ isActive: true }).select("name slug").sort("displayOrder"),
    Brand.find({ isActive: true }).select("name slug").sort("name"),
    RoomType.find({ isActive: true }).select("name slug").sort("name"),
    Material.find({ isActive: true }).select("name slug").sort("name"),
    Color.find({ isActive: true }).select("name hexCode").sort("name"),
    Product.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: { status: "published" } },
      { $unwind: "$roomTypes" },
      { $group: { _id: "$roomTypes", count: { $sum: 1 } } },
    ]),
    // Material/Color live on ProductVariant, so their count is "how many
    // distinct published Products have at least one active variant with
    // this material/color" — a $lookup back to Product is what makes
    // "published" reachable from a Variant-rooted aggregation.
    ProductVariant.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $match: { "product.status": "published" } },
      { $group: { _id: "$material", products: { $addToSet: "$product._id" } } },
    ]),
    ProductVariant.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $match: { "product.status": "published" } },
      { $group: { _id: "$color", products: { $addToSet: "$product._id" } } },
    ]),
  ]);

  const toCountMap = (rows) => new Map(rows.map((r) => [String(r._id), r.count]));
  const toDistinctCountMap = (rows) =>
    new Map(rows.map((r) => [String(r._id), r.products.length]));

  const categoryCountMap = toCountMap(categoryCounts);
  const brandCountMap = toCountMap(brandCounts);
  const roomTypeCountMap = toCountMap(roomTypeCounts);
  const materialCountMap = toDistinctCountMap(materialCounts);
  const colorCountMap = toDistinctCountMap(colorCounts);

  const withCount = (docs, countMap) =>
    docs.map((doc) => ({ ...doc.toObject(), count: countMap.get(String(doc._id)) || 0 }));

  return res.status(200).json({
    success: true,
    data: {
      categories: withCount(categories, categoryCountMap),
      brands: withCount(brands, brandCountMap),
      roomTypes: withCount(roomTypes, roomTypeCountMap),
      materials: withCount(materials, materialCountMap),
      colors: withCount(colors, colorCountMap),
    },
  });
};

export const getProductById = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .populate("roomTypes", "name slug")
    .populate("variantCount");

  if (!product) {
    throw new AppError("Product not found.", 404);
  }

  // A non-admin caller gets the same 404 as a truly missing product —
  // never a distinct "exists but you can't see it" response, which would
  // leak the existence of unpublished products to an anonymous caller.
  if (req.user?.role !== "admin" && product.status !== "published") {
    throw new AppError("Product not found.", 404);
  }

  // Attached here rather than fetched separately by the product page, so
  // the star rating renders with the rest of the product instead of
  // popping in after a second request.
  const summary = await getReviewSummary(productId);

  return res.status(200).json({
    success: true,
    data: {
      ...product.toObject(),
      averageRating: summary.averageRating,
      reviewCount: summary.reviewCount,
    },
  });
};

export const updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { name, description, category, brand, roomTypes, images, specifications, seo, status } =
    req.body;

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found.", 404);
  }

  await assertReferencesExist({ category, brand, roomTypes });

  // Clean up images that were removed or replaced during this update
  const oldPublicIds = product.images.map((img) => img.publicId).filter(Boolean);
  const newPublicIds = images.map((img) => img.publicId).filter(Boolean);
  const removedPublicIds = oldPublicIds.filter((id) => !newPublicIds.includes(id));

  for (const publicId of removedPublicIds) {
    try {
      await deleteFromCloudinary(publicId);
    } catch (err) {
      console.error("Failed to delete old Cloudinary image:", err);
    }
  }

  product.name = name;
  product.description = description;
  product.category = category;
  product.brand = brand;
  product.roomTypes = roomTypes;
  product.images = images;
  product.specifications = specifications;
  product.seo = seo;
  product.status = status;

  await product.save();

  await product.populate([
    { path: "category", select: "name slug" },
    { path: "brand", select: "name slug" },
    { path: "roomTypes", select: "name slug" },
    { path: "variantCount" },
  ]);

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
};

export const deleteProduct = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId).populate("variantCount");

  if (!product) {
    throw new AppError("Product not found.", 404);
  }

  if (product.variantCount > 0 && req.query.confirmCascade !== "true") {
    return res.status(409).json({
      success: false,
      message: `This product has ${product.variantCount} variant${product.variantCount > 1 ? "s" : ""}. Deleting it will also delete all of its variants.`,
      variantCount: product.variantCount,
    });
  }

  const variants = await ProductVariant.find({ product: productId });

  for (const variant of variants) {
    for (const image of variant.images) {
      if (image.publicId) {
        try {
          await deleteFromCloudinary(image.publicId);
        } catch (err) {
          console.error("Failed to delete variant Cloudinary image:", err);
        }
      }
    }
  }

  await ProductVariant.deleteMany({ product: productId });

  for (const image of product.images) {
    if (image.publicId) {
      try {
        await deleteFromCloudinary(image.publicId);
      } catch (err) {
        console.error("Failed to delete Cloudinary image:", err);
      }
    }
  }

  await product.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
};
