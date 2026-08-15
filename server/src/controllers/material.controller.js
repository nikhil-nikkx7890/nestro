import Material from "../models/material.model.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";
import AppError from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

export const createMaterial = async (req, res) => {
  const { name, isActive, image } = req.body;

  const existingMaterial = await Material.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
  });

  if (existingMaterial) {
    throw new AppError("Material already exists!", 409);
  }

  const material = await Material.create({
    name,
    isActive,
    image: image ?? { url: "", publicId: "" },
  });
  return res.status(201).json({
    success: true,
    message: "Material created successfully",
    data: material,
  });
};

export const getAllMaterials = async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
    sortableFields: ["name", "createdAt", "isActive"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  const [materials, total] = await Promise.all([
    Material.find(filter).sort(sort).skip(skip).limit(limit),
    Material.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: materials,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getMaterialById = async (req, res) => {
  const { materialId } = req.params;

  const material = await Material.findById(materialId);
  if (!material) {
    throw new AppError("Material not found!", 404);
  }
  return res.status(200).json({
    success: true,
    data: material,
  });
};

export const updateMaterial = async (req, res) => {
  const { materialId } = req.params;
  const { name, isActive, image } = req.body;

  const material = await Material.findById(materialId);
  if (!material) {
    throw new AppError("Material not found!", 404);
  }
  const duplicateMaterial = await Material.findOne({
    _id: { $ne: materialId },
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
  });
  if (duplicateMaterial) {
    throw new AppError("Material already exists!", 409);
  }
  material.name = name;
  material.isActive = isActive;

  if (
    image &&
    material.image?.publicId &&
    image.publicId !== material.image.publicId
  ) {
    try {
      await deleteFromCloudinary(material.image.publicId);
    } catch (err) {
      console.error("Failed to delete old Cloudinary image:", err);
    }
  }

  material.image = image ?? material.image;

  await material.save();
  return res.status(200).json({
    success: true,
    message: "Material updated successfully",
    data: material,
  });
};

export const deleteMaterial = async (req, res) => {
  const { materialId } = req.params;

  const material = await Material.findById(materialId);
  if (!material) {
    throw new AppError("Material not found!", 404);
  }

  if (material.image?.publicId) {
    try {
      await deleteFromCloudinary(material.image.publicId);
    } catch (err) {
      console.error("Failed to delete Cloudinary image:", err);
    }
  }

  await material.deleteOne();
  return res.status(200).json({
    success: true,
    message: "Material deleted successfully",
  });
};
