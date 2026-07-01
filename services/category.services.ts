import { Response } from "express";
import Category from "../models/category.model";
import { CategoryName } from "../type/category";
import { request } from "../type/express";
import Property from "../models/property.model";

export const seedCategories = async () => {
  const categories = Object.values(CategoryName);

  for (const name of categories) {
    await Category.updateOne(
      { name },
      { $setOnInsert: { name } },
      { upsert: true },
    );
  }

  console.log("Categories seeded successfully.");
};

export const createCategory = async (req: request, res: Response) => {
  try {
    const { name } = req.body;

    const exists = await Category.findOne({
      name: {
        $regex: new RegExp(`^${name}$`, "i"),
      },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists.",
      });
    }

    const category = await Category.create({
      name,
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getCategories = async (req: request, res: Response) => {
  try {
    const categories = await Category.find().sort({
      name: 1,
    });

    return res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateCategory = async (req: request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    category.name = req.body.name;

    await category.save();

    return res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteCategory = async (req: request, res: Response) => {
  try {
    const propertyExists = await Property.exists({
      category: req.params.id,
    });

    if (propertyExists) {
      return res.status(400).json({
        success: false,
        message: "Category is used by one or more properties.",
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
