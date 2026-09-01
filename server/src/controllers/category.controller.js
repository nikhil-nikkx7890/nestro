import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";
import AppError from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { assertNotReferenced } from "../utils/checkReferences.js";

const createCategory = async (req, res) => {
  const {
    name,
    description = "",
    displayOrder = 0,
    image,
    isActive,
  } = req.body;
  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
  });
  if (existingCategory) {
    throw new AppError("Category already exists", 409);
  }
  const category = await Category.create({
    name,
    description,
    displayOrder,
    image: image ?? { url: "", publicId: "" },
    isActive,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
};

const getCategories = async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
    sortableFields: ["name", "displayOrder", "createdAt", "isActive"],
    defaultSortBy: "displayOrder",
    defaultSortOrder: "asc",
  });

  const [categories, total] = await Promise.all([
    Category.find(filter).sort(sort).skip(skip).limit(limit).populate("productCount"),
    Category.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: categories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

const getCategoryById = async (req, res) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId).populate("productCount");
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return res.status(200).json({
    success: true,
    message: "Category fetched successfully.",
    data: category,
  });
};

const updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { name, description, displayOrder, image, isActive } = req.body;

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (name) {
    const duplicateCategory = await Category.findOne({
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
    });

    if (duplicateCategory) {
      throw new AppError("Category already exists.", 409);
    }
  }

  category.name = name ?? category.name;
  category.description = description ?? category.description;
  category.displayOrder = displayOrder ?? category.displayOrder;
  category.isActive = isActive ?? category.isActive;

  if (
    image &&
    category.image?.publicId &&
    image.publicId !== category.image.publicId
  ) {
    try {
      await deleteFromCloudinary(category.image.publicId);
    } catch (err) {
      console.error("Failed to delete old Cloudinary image:", err);
    }
  }

  category.image = image ?? category.image;

  await category.save();

  return res.status(200).json({
    success: true,
    message: "Category updated successfully.",
    data: category,
  });
};

const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found.", 404);
  }

  await assertNotReferenced(Product, "category", categoryId, "product");

  if (category.image?.publicId) {
    try {
      await deleteFromCloudinary(category.image.publicId);
    } catch (err) {
      console.error("Failed to delete Cloudinary image:", err);
    }
  }

  await category.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Category deleted successfully.",
  });
};

export {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
