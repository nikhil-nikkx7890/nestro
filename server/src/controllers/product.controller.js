import Product from "../models/product.model.js";
import ProductVariant from "../models/productVariant.model.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import RoomType from "../models/roomType.model.js";
import AppError from "../utils/AppError.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

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

  return res.status(200).json({
    success: true,
    data: products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

  return res.status(200).json({
    success: true,
    data: product,
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
