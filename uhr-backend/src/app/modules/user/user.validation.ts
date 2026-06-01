import { z } from "zod";

// ─── Profile ────────────────────────────────────────────────────────────────

const updateProfileZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number format")
      .optional(),
    avatar: z.url("Avatar must be a valid URL").optional(),
  }),
});

// ─── Address ────────────────────────────────────────────────────────────────

const createAddressZodSchema = z.object({
  body: z.object({
    fullName: z.string({ message: "Full name is required" }).min(1),
    phone: z
      .string({ message: "Phone is required" })
      .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number format"),
    city: z.string({ message: "City is required" }).min(1),
    area: z.string({ message: "Area is required" }).min(1),
    street: z.string({ message: "Street is required" }).min(1),
    isDefault: z.boolean().optional(),
  }),
});

const updateAddressZodSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number format")
      .optional(),
    city: z.string().min(1).optional(),
    area: z.string().min(1).optional(),
    street: z.string().min(1).optional(),
    isDefault: z.boolean().optional(),
  }),
});

// ─── Admin ──────────────────────────────────────────────────────────────────

const updateUserRoleZodSchema = z.object({
  body: z.object({
    role: z.enum(["USER", "SELLER", "ADMIN", "SUPER_ADMIN"], {
      message: "Invalid role",
    }),
  }),
});

const updateUserStatusZodSchema = z.object({
  body: z
    .object({
      isBanned: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => data.isBanned !== undefined || data.isActive !== undefined, {
      message: "At least one of isBanned or isActive must be provided",
    }),
});

export const UserValidation = {
  updateProfileZodSchema,
  createAddressZodSchema,
  updateAddressZodSchema,
  updateUserRoleZodSchema,
  updateUserStatusZodSchema,
};
