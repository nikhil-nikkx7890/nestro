import Color from "../models/color.model.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";
import AppError from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";

export const createColor = async (req, res) => {
    const { name, hexCode, isActive } = req.body;

    const existingColor = await Color.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
    });

    if (existingColor) {
        throw new AppError("Color already exists.", 409);
    }

    const color = await Color.create({
        name,
        hexCode,
        isActive,
    });

    return res.status(201).json({
        success: true,
        message: "Color created successfully.",
        data: color,
    });
};

export const getAllColors = async (req, res) => {
    const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
        searchableFields: ["name"],
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc",
    });

    const [colors, total] = await Promise.all([
        Color.find(filter).sort(sort).skip(skip).limit(limit),
        Color.countDocuments(filter),
    ]);

    return res.status(200).json({
        success: true,
        data: colors,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
};


export const getColorById = async (req, res) => {
    const { colorId } = req.params;

    const color = await Color.findById(colorId);

    if (!color) {
        throw new AppError("Color not found.", 404);
    }

    return res.status(200).json({
        success: true,
        data: color,
    });
};

/**
 * Update Color
 */
export const updateColor = async (req, res) => {
    const { colorId } = req.params;
    const { name, hexCode, isActive } = req.body;

    const color = await Color.findById(colorId);

    if (!color) {
        throw new AppError("Color not found.", 404);
    }

    const duplicateColor = await Color.findOne({
        _id: { $ne: colorId },
        name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
    });

    if (duplicateColor) {
        throw new AppError("Color already exists.", 409);
    }

    color.name = name;
    color.hexCode = hexCode;
    color.isActive = isActive;

    await color.save();

    return res.status(200).json({
        success: true,
        message: "Color updated successfully.",
        data: color,
    });
};

/**
 * Delete Color
 */
export const deleteColor = async (req, res) => {
    const { colorId } = req.params;

    const color = await Color.findById(colorId);

    if (!color) {
        throw new AppError("Color not found.", 404);
    }

    await color.deleteOne();

    return res.status(200).json({
        success: true,
        message: "Color deleted successfully.",
    });
};
