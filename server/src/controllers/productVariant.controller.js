import ProductVariant from "../models/productVariant.model.js";
import Product from "../models/product.model.js";
import Material from "../models/material.model.js";
import Color from "../models/color.model.js";
import AppError from "../utils/AppError.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { generateUniqueSku } from "../utils/generateUniqueSku.js";

const assertVariantReferencesExist = async ({ material, color }) => {
  const [materialDoc, colorDoc] = await Promise.all([
    Material.exists({ _id: material }),
    Color.exists({ _id: color }),
  ]);

  if (!materialDoc) {
    throw new AppError("Material not found.", 400);
  }
  if (!colorDoc) {
    throw new AppError("Color not found.", 400);
  }
};

/**
 * Wraps a create/save call and converts a Mongo duplicate-key error
 * (E11000, from the compound (product, material, color) index) into
 * a friendly 409 instead of a raw Mongo error leaking to the client.
 */
const runOrConflict = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        "A variant with this material and color already exists for this product.",
        409,
      );
    }
    throw err;
  }
};

export const createProductVariant = async (req, res) => {
  const { productId } = req.params;
  const {
    price,
    compareAtPrice,
    material,
    color,
    images,
    stock,
    lowStockThreshold,
    dimensions,
    weight,
    isActive,
  } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found.", 404);
  }

  await assertVariantReferencesExist({ material, color });

  const [materialDoc, colorDoc] = await Promise.all([
    Material.findById(material),
    Color.findById(color),
  ]);

  const sku = await generateUniqueSku(ProductVariant, {
    product,
    material: materialDoc,
    color: colorDoc,
  });

  const variant = await runOrConflict(() =>
    ProductVariant.create({
      product: productId,
      sku,
      price,
      compareAtPrice,
      material,
      color,
      images,
      stock,
      lowStockThreshold,
      dimensions,
      weight,
      isActive,
    }),
  );

  await variant.populate([
    { path: "material", select: "name slug" },
    { path: "color", select: "name hexCode" },
  ]);

  return res.status(201).json({
    success: true,
    message: "Product variant created successfully",
    data: variant,
  });
};

export const getVariantsByProduct = async (req, res) => {
  const { productId } = req.params;

  const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
    sortableFields: ["price", "stock", "createdAt"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  const combinedFilter = { ...filter, product: productId };

  const [variants, total] = await Promise.all([
    ProductVariant.find(combinedFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("material", "name slug")
      .populate("color", "name hexCode"),
    ProductVariant.countDocuments(combinedFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: variants,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getVariantById = async (req, res) => {
  const { variantId } = req.params;

  const variant = await ProductVariant.findById(variantId)
    .populate("material", "name slug")
    .populate("color", "name hexCode");

  if (!variant) {
    throw new AppError("Product variant not found.", 404);
  }

  return res.status(200).json({
    success: true,
    data: variant,
  });
};

export const updateProductVariant = async (req, res) => {
  const { variantId } = req.params;
  const {
    price,
    compareAtPrice,
    material,
    color,
    images,
    stock,
    lowStockThreshold,
    dimensions,
    weight,
    isActive,
  } = req.body;

  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new AppError("Product variant not found.", 404);
  }

  await assertVariantReferencesExist({ material, color });

  // Only regenerate the SKU when material or color actually changed —
  // otherwise editing price/stock on an existing variant would silently
  // rewrite its SKU every time, which is surprising and breaks anything
  // external (e.g. a printed label) that already references it.
  const materialChanged = material !== variant.material.toString();
  const colorChanged = color !== variant.color.toString();

  if (materialChanged || colorChanged) {
    const [product, materialDoc, colorDoc] = await Promise.all([
      Product.findById(variant.product),
      Material.findById(material),
      Color.findById(color),
    ]);
    variant.sku = await generateUniqueSku(
      ProductVariant,
      { product, material: materialDoc, color: colorDoc },
      variant._id,
    );
  }

  const oldPublicIds = variant.images.map((img) => img.publicId).filter(Boolean);
  const newPublicIds = images.map((img) => img.publicId).filter(Boolean);
  const removedPublicIds = oldPublicIds.filter((id) => !newPublicIds.includes(id));

  for (const publicId of removedPublicIds) {
    try {
      await deleteFromCloudinary(publicId);
    } catch (err) {
      console.error("Failed to delete old Cloudinary image:", err);
    }
  }

  variant.price = price;
  variant.compareAtPrice = compareAtPrice;
  variant.material = material;
  variant.color = color;
  variant.images = images;
  variant.stock = stock;
  variant.lowStockThreshold = lowStockThreshold;
  variant.dimensions = dimensions;
  variant.weight = weight;
  variant.isActive = isActive;

  await runOrConflict(() => variant.save());

  await variant.populate([
    { path: "material", select: "name slug" },
    { path: "color", select: "name hexCode" },
  ]);

  return res.status(200).json({
    success: true,
    message: "Product variant updated successfully",
    data: variant,
  });
};

export const deleteProductVariant = async (req, res) => {
  const { variantId } = req.params;

  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new AppError("Product variant not found.", 404);
  }

  for (const image of variant.images) {
    if (image.publicId) {
      try {
        await deleteFromCloudinary(image.publicId);
      } catch (err) {
        console.error("Failed to delete Cloudinary image:", err);
      }
    }
  }

  await variant.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Product variant deleted successfully",
  });
};
