import Brand from "../models/brands.model.js";
import {validateObjectId} from "../middlewares/validateObjectId.js";

export const createBrand = async (req, res) => {
    try{
        const {name, isActive} = req.body;
        const existingBrand = await Brand.findOne({
            name:{$regex:new RegExp(`^${name}$`, "i")},
        });

        if (existingBrand){
            return res.status(409).json({
                success: false,
                message: `Brand with name "${name}" already exists`,
            });
        }

        const brand = await Brand.create({
            name,
            isActive,
        });
        return res.status(201).json({
            success: true,
            message:"Brand created successfully",
            data: brand,
        });
    }catch (error){
    return res.status(500).json({
        success: false,
        message:"Failed to create brand",
        error: error.message,
    });
    }
};

export const getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.find();
        return res.status(200).json({
            success: true,
            count: brands.length,
            data: brands,
        });

    }catch (error){
        return res.status(500).json({
            success: false,
            message:"Failed to get all brands",
            error: error.message,
        });
    }
};

export const getBrandById = async (req, res) => {
    try {
        const {brandId} = req.params;
        if (!validateObjectId(brandId)) return ;
        const brand = await Brand.findById(brandId);
        if (!brand) {
            return res.status(404).json({
                success: false,
                message:"Brand not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: brand,
        });

    }catch (error) {
        return res.status(500).json({
            success: false,
            message:"Failed to get brand",
            error: error.message,
        });
    }
};

export const updateBrand = async (req, res) => {
    try {
        const {brandId} = req.params;
        const {name, isActive} = req.body;
        if (!validateObjectId(brandId)) return ;
        const brand = await Brand.findById(brandId);
        if (!brand) {
            return res.status(404).json({
                success: false,
                message:"Brand not found",
            });
        }

        const duplicateBrand = await Brand.findOne({
            _id:{ $ne : brandId },
            name:{ $regex: new RegExp(`^${name}$`, "i") },
        });
        if (duplicateBrand){
            return res.status(409).json({
                success: false,
                message:"Brand already exists",
            });
        }
        brand.name = name;
        brand.isActive = isActive;

        await brand.save()
        return res.status(200).json({
            success: true,
            message:"Brand updated successfully",
            data: brand,
        });

    }catch (error) {
        return res.status(500).json({
            success: false,
            message:"Failed to update brand",
            error: error.message,
        });
    }
};

export const deleteBrand = async (req, res) => {
    try {
        const {brandId} = req.params;
        if (!validateObjectId(brandId)) return ;
        const brand = await Brand.findById(brandId);
        if (!brand){
            return res.status(404).json({
                success: false,
                message:"Brand not found",
            });
        }
        await brand.deleteOne()
        return res.status(200).json({
            success: true,
            message:"Brand deleted successfully",
        })
    }catch (error) {
        return res.status(500).json({
            success: false,
            message:"Failed to delete brand",
            error: error.message,
        });
    }
};


