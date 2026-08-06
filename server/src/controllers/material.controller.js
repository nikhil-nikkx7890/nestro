import Material from "../models/material.model.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";

export const createMaterial = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const existingMaterial = await Material.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingMaterial) {
      return res.status(409).json({
        success: false,
        message: "Material already exists!",
      });
    }

    const material = await Material.create({
      name,
      isActive,
    });
    return res.status(201).json({
      success: true,
      message: "Material created successfully",
      data: material,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create material",
      error: error.message,
    });
  }
};

export const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find();
    return res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get all materials",
      error: error.message,
    });
  }
};

export const getMaterialById = async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found!",
      });
    }
    return res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get material",
      error: error.message,
    });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { name, isActive } = req.body;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found!",
      });
    }
    const duplicateMaterial = await Material.findOne({
      _id: { $ne: materialId },
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (duplicateMaterial) {
      return res.status(409).json({
        success: false,
        message: "Material already exists!",
      });
    }
    material.name = name;
    material.isActive = isActive;

    await material.save();
    return res.status(200).json({
      success: true,
      message: "Material updated successfully",
      data: material,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update material",
      error: error.message,
    });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found!",
      });
    }
    await material.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete material",
      error: error.message,
    });
  }
};
