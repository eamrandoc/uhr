import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import AppError from "../../errors/AppError";
import {
  TCategoryResponse,
  TCreateCategoryInput,
  TGetCategoriesQuery,
  TGetCategoriesResponse,
  TUpdateCategoryInput,
} from "./category.interface";

// ==========================================
// 🛠️ Private Helpers
// ==========================================

/**
 * Fetches a category by ID. Throws 404 if not found or soft-deleted.
 */
const findCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category || category.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found!");
  }

  return category;
};

/**
 * Checks that no other category uses the same slug.
 * Optionally excludes a specific category ID (for updates).
 */
const ensureUniqueSlug = async (slug: string, excludeId?: string): Promise<void> => {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing && existing.id !== excludeId) {
    throw new AppError(httpStatus.CONFLICT, `A category with slug "${slug}" already exists!`);
  }
};

/**
 * Checks that no other category uses the same name.
 * Optionally excludes a specific category ID (for updates).
 */
const ensureUniqueName = async (name: string, excludeId?: string): Promise<void> => {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing && existing.id !== excludeId) {
    throw new AppError(httpStatus.CONFLICT, `A category named "${name}" already exists!`);
  }
};

// ==========================================
// 📂 Public Category Operations
// ==========================================

/**
 * Returns all active, non-deleted categories with optional pagination,
 * search, and filtering. Sub-categories are included nested under parents.
 */
const getAllCategories = async (query: TGetCategoriesQuery): Promise<TGetCategoriesResponse> => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const whereClause = {
    isDeleted: false,
    // Default to active only for public; admin can pass isActive=undefined
    ...(query.isActive !== undefined ? { isActive: query.isActive } : { isActive: true }),
    // Top-level only if requested
    ...(query.parentOnly ? { parentId: null } : {}),
    // Name/description search
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" as const } },
        { description: { contains: query.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        // Include one level of sub-categories
        subCategory: {
          where: { isDeleted: false, isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    }),
    prisma.category.count({ where: whereClause }),
  ]);

  return {
    categories: categories as TCategoryResponse[],
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
  };
};

/**
 * Returns a single category by its ID, including its sub-categories.
 */
const getCategoryById = async (id: string): Promise<TCategoryResponse> => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      subCategory: {
        where: { isDeleted: false, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!category || category.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found!");
  }

  return category as TCategoryResponse;
};

/**
 * Returns a single category by its slug, including its sub-categories.
 */
const getCategoryBySlug = async (slug: string): Promise<TCategoryResponse> => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      subCategory: {
        where: { isDeleted: false, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!category || category.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found!");
  }

  return category as TCategoryResponse;
};

// ==========================================
// 🔧 Admin Category Operations
// ==========================================

/**
 * Creates a new category. Validates unique name and slug.
 * If parentId is provided, confirms the parent exists.
 */
const createCategory = async (data: TCreateCategoryInput): Promise<TCategoryResponse> => {
  // Validate uniqueness
  await ensureUniqueName(data.name);
  await ensureUniqueSlug(data.slug);

  // Validate parent exists if parentId is provided
  if (data.parentId) {
    await findCategoryById(data.parentId);
  }

  const category = await prisma.category.create({
    data,
    include: {
      subCategory: true,
    },
  });

  return category as TCategoryResponse;
};

/**
 * Updates a category. Validates unique name/slug on change.
 * Guards against a category being set as its own parent (circular reference).
 */
const updateCategory = async (
  id: string,
  data: TUpdateCategoryInput
): Promise<TCategoryResponse> => {
  await findCategoryById(id);

  // Validate uniqueness if name/slug is changing
  if (data.name) {
    await ensureUniqueName(data.name, id);
  }
  if (data.slug) {
    await ensureUniqueSlug(data.slug, id);
  }

  // Guard against self-referencing parent (circular dependency)
  if (data.parentId === id) {
    throw new AppError(httpStatus.BAD_REQUEST, "A category cannot be its own parent!");
  }

  // Validate parent exists if parentId is being changed
  if (data.parentId) {
    await findCategoryById(data.parentId);
  }

  const updated = await prisma.category.update({
    where: { id },
    data,
    include: {
      subCategory: {
        where: { isDeleted: false },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  return updated as TCategoryResponse;
};

/**
 * Soft-deletes a category.
 * Also soft-deletes all direct sub-categories to prevent orphaned records.
 */
const deleteCategory = async (id: string): Promise<void> => {
  const category = await findCategoryById(id);

  if (category.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "Category is already deleted!");
  }

  // Soft-delete sub-categories first
  await prisma.category.updateMany({
    where: { parentId: id, isDeleted: false },
    data: { isDeleted: true, isActive: false },
  });

  // Soft-delete the category itself
  await prisma.category.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  });
};

/**
 * Returns all categories (including inactive) for admin management.
 * No pagination — used for admin dropdowns and full list views.
 */
const getAllCategoriesForAdmin = async (): Promise<TCategoryResponse[]> => {
  const categories = await prisma.category.findMany({
    where: { isDeleted: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      subCategory: {
        where: { isDeleted: false },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  return categories as TCategoryResponse[];
};

export const CategoryService = {
  // Public
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  // Admin
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoriesForAdmin,
};
