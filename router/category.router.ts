import express from "express";
import { auth } from "../middleware/auth";
import { UserRole } from "../type/user";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
} from "../services/category.services";
import { validate } from "../middleware/validate";
import {
  categoryIdSchema,
  createCategorySchema,
} from "../validations/category.validation";

const router = express.Router();

router.post(
  "/",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  validate(createCategorySchema),
  createCategory,
);

router.get("/", getCategories);

router.patch(
  "/:id",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  validate(categoryIdSchema, "params"),
  validate(createCategorySchema),
  updateCategory,
);

router.delete(
  "/:id",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  validate(categoryIdSchema, "params"),
  deleteCategory,
);

export default router;
