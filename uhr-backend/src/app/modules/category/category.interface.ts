import { Category } from "../../../../generated/prisma/client";

// ─── Base ────────────────────────────────────────────────────────────────────

/** Full category response (with optional nested sub-categories) */
export type TCategoryResponse = Category & {
  subCategory?: TCategoryResponse[];
};

// ─── Create ──────────────────────────────────────────────────────────────────

export interface TCreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  icon?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
}

// ─── Update ──────────────────────────────────────────────────────────────────

export interface TUpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  icon?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ─── Query ───────────────────────────────────────────────────────────────────

export interface TGetCategoriesQuery {
  page?: number;
  limit?: number;
  search?: string;
  /** Filter by active status — undefined means return all */
  isActive?: boolean;
  /** Only return top-level categories (no parentId) */
  parentOnly?: boolean;
}

export interface TGetCategoriesResponse {
  categories: TCategoryResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
}
