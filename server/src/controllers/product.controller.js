import Product from "../models/product.model.js";
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

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .populate("roomTypes", "name slug"),
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
    .populate("roomTypes", "name slug");

  if (!product) {
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

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
};

export const deleteProduct = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found.", 404);
  }

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
