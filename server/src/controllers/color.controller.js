import Color from "../models/color.model.js";

export const createColor = async (req, res) => {
    try {
        const { name, isActive } = req.body;

        const existingColor = await Color.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });

        if (existingColor) {
            return res.status(409).json({
                success: false,
                message: "Color already exists.",
            });
        }

        const color = await Color.create({
            name,
            isActive,
        });

        return res.status(201).json({
            success: true,
            message: "Color created successfully.",
            data: color,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create color.",
            error: error.message,
        });
    }
};

export const getAllColors = async (req, res) => {
    try {
        const colors = await Color.find();

        return res.status(200).json({
            success: true,
            count: colors.length,
            data: colors,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch colors.",
            error: error.message,
        });
    }
};


export const getColorById = async (req, res) => {
    try {
        const { colorId } = req.params;

        const color = await Color.findById(colorId);

        if (!color) {
            return res.status(404).json({
                success: false,
                message: "Color not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: color,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch color.",
            error: error.message,
        });
    }
};

/**
 * Update Color
 */
export const updateColor = async (req, res) => {
    try {
        const { colorId } = req.params;
        const { name, isActive } = req.body;

        const color = await Color.findById(colorId);

        if (!color) {
            return res.status(404).json({
                success: false,
                message: "Color not found.",
            });
        }

        const duplicateColor = await Color.findOne({
            _id: { $ne: colorId },
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });

        if (duplicateColor) {
            return res.status(409).json({
                success: false,
                message: "Color already exists.",
            });
        }

        color.name = name;
        color.isActive = isActive;

        await color.save();

        return res.status(200).json({
            success: true,
            message: "Color updated successfully.",
            data: color,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update color.",
            error: error.message,
        });
    }
};

/**
 * Delete Color
 */
export const deleteColor = async (req, res) => {
    try {
        const { colorId } = req.params;

        const color = await Color.findById(colorId);

        if (!color) {
            return res.status(404).json({
                success: false,
                message: "Color not found.",
            });
        }

        await color.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Color deleted successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete color.",
            error: error.message,
        });
    }
};