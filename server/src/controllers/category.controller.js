import Category from "../models/category.model.js";

const createCategory = async (req, res) => {
  try {
    const { name, description = "", displayOrder = 0 } = req.body;
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }
    const category = await Category.create({
      name,
      description,
      displayOrder,
      image: "",
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully.",
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Category fetched successfully.",
      data: category,
    });
  } catch (error) {
    console.error("Get Category Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, displayOrder, image, isActive } = req.body;

    const category = await Category.findById(categoryId)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    category.name = name ?? category.name
    category.description = description ?? category.description
    category.displayOrder = displayOrder ?? category.displayOrder
    category.image = image ?? category.image
    category.isActive = isActive ?? category.isActive

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: category,
    });


  } catch (error) {
    console.error("Update Category error:", error);
    if (error.code === 11000){
      return res.status(409).json({
        success: false,
        message: "Category already exists.",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });

  } catch (error) {
    console.error("Delete Category error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { createCategory, getCategories, updateCategory, deleteCategory, getCategoryById };
