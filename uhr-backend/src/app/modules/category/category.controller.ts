import { Request, Response } from "express";
import httpStatus from "http-status";
import { CategoryService } from "./category.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// ─── Public ──────────────────────────────────────────────────────────────────

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page as string | undefined;
  const limit = req.query.limit as string | undefined;
  const search = req.query.search as string | undefined;
  const parentOnly = req.query.parentOnly as string | undefined;

  const result = await CategoryService.getAllCategories({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search,
    isActive: true, // Public route — only active categories
    parentOnly: parentOnly === "true",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories retrieved successfully!",
    meta: result.meta,
    data: result.categories,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await CategoryService.getCategoryById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category retrieved successfully!",
    data: result,
  });
});

const getCategoryBySlug = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const result = await CategoryService.getCategoryBySlug(slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category retrieved successfully!",
    data: result,
  });
});

// ─── Admin ───────────────────────────────────────────────────────────────────

const getAllCategoriesForAdmin = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page as string | undefined;
  const limit = req.query.limit as string | undefined;
  const search = req.query.search as string | undefined;
  const isActiveParam = req.query.isActive as string | undefined;

  // Admin can filter by isActive or see all (undefined = all)
  const isActive =
    isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;

  const result = await CategoryService.getAllCategories({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search,
    isActive,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories retrieved successfully!",
    meta: result.meta,
    data: result.categories,
  });
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.createCategory(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category created successfully!",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await CategoryService.updateCategory(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully!",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await CategoryService.deleteCategory(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully!",
    data: null,
  });
});

export const CategoryController = {
  // Public
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  // Admin
  getAllCategoriesForAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};
