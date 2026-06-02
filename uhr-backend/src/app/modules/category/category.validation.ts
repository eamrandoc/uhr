import { z } from "zod";

// ─── Shared ──────────────────────────────────────────────────────────────────

/**
 * Generates a URL-safe slug from a string.
 * Used as a transform so callers don't have to slug manually.
 */
const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only");

// ─── Create ──────────────────────────────────────────────────────────────────

const createCategoryZodSchema = z.object({
  body: z.object({
    name: z.string({ message: "Name is required" }).min(1, "Name cannot be empty"),
    slug: slugSchema,
    description: z.string().optional(),
    parentId: z.string().uuid("Parent ID must be a valid UUID").optional(),
    image: z.url("Image must be a valid URL").optional(),
    icon: z.url("Icon must be a valid URL").optional(),
    metaTitle: z.string().max(70, "Meta title must be 70 characters or less").optional(),
    metaDescription: z.string().max(160, "Meta description must be 160 characters or less").optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

// ─── Update ──────────────────────────────────────────────────────────────────

const updateCategoryZodSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name cannot be empty").optional(),
      slug: slugSchema.optional(),
      description: z.string().optional(),
      parentId: z.string().uuid("Parent ID must be a valid UUID").nullable().optional(),
      image: z.url("Image must be a valid URL").optional(),
      icon: z.url("Icon must be a valid URL").optional(),
      metaTitle: z.string().max(70, "Meta title must be 70 characters or less").optional(),
      metaDescription: z.string().max(160, "Meta description must be 160 characters or less").optional(),
      sortOrder: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided to update",
    }),
});

export const CategoryValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
};
