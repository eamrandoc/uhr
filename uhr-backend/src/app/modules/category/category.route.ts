import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";

const router = express.Router();

// ─── Public Routes (no auth required) ───────────────────────────────────────

/** GET /categories — List all active categories (with sub-categories nested) */
router.get("/", CategoryController.getAllCategories);

/** GET /categories/slug/:slug — Get a category by slug */
router.get("/slug/:slug", CategoryController.getCategoryBySlug);

/** GET /categories/:id — Get a category by ID */
router.get("/:id", CategoryController.getCategoryById);

// ─── Admin Routes ────────────────────────────────────────────────────────────

/** GET /categories/admin/all — Get all categories incl. inactive (Admin+) */
router.get(
  "/admin/all",
  auth("ADMIN", "SUPER_ADMIN"),
  CategoryController.getAllCategoriesForAdmin
);

/** POST /categories — Create a new category (Admin+) */
router.post(
  "/",
  auth("ADMIN", "SUPER_ADMIN"),
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory
);

/** PATCH /categories/:id — Update a category (Admin+) */
router.patch(
  "/:id",
  auth("ADMIN", "SUPER_ADMIN"),
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory
);

/** DELETE /categories/:id — Soft-delete a category (Super Admin only) */
router.delete("/:id", auth("SUPER_ADMIN"), CategoryController.deleteCategory);

export const CategoryRoutes = router;
