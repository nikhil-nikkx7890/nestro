import Brand from "../models/brand.model.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";
import AppError from "../utils/AppError.js";

export const createBrand = async (req, res) => {
  const { name, isActive, image } = req.body;
  const existingBrand = await Brand.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });

  if (existingBrand) {
    throw new AppError(`Brand with name "${name}" already exists`, 409);
  }

  const brand = await Brand.create({
    name,
    isActive,
    image: image ?? { url: "", publicId: "" },
  });
  return res.status(201).json({
    success: true,
    message: "Brand created successfully",
    data: brand,
  });
};

export const getAllBrands = async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
    searchableFields: ["name"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  const [brands, total] = await Promise.all([
    Brand.find(filter).sort(sort).skip(skip).limit(limit),
    Brand.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: brands,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getBrandById = async (req, res) => {
  const { brandId } = req.params;
  if (!validateObjectId(brandId)) return;
  const brand = await Brand.findById(brandId);
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }
  return res.status(200).json({
    success: true,
    data: brand,
  });
};

export const updateBrand = async (req, res) => {
  const { brandId } = req.params;
  const { name, isActive, image } = req.body;
  if (!validateObjectId(brandId)) return;
  const brand = await Brand.findById(brandId);
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  const duplicateBrand = await Brand.findOne({
    _id: { $ne: brandId },
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
  if (duplicateBrand) {
    throw new AppError("Brand already exists", 409);
  }
  brand.name = name;
  brand.isActive = isActive;
  brand.image = image ?? brand.image;

  await brand.save();
  return res.status(200).json({
    success: true,
    message: "Brand updated successfully",
    data: brand,
  });
};

export const deleteBrand = async (req, res) => {
  const { brandId } = req.params;
  if (!validateObjectId(brandId)) return;
  const brand = await Brand.findById(brandId);
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }
  await brand.deleteOne();
  return res.status(200).json({
    success: true,
    message: "Brand deleted successfully",
  });
};
