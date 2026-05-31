import { z } from "zod";

const registerUserZodSchema = z.object({
  body: z.object({
    name: z.string({ message: "Name is required" }),
    email: z.email({ message: "Email is required" }),
    password: z
      .string({ message: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
  }),
});

const loginUserZodSchema = z.object({
  body: z.object({
    email: z.email({ message: "Email is required" }),
    password: z.string({ message: "Password is required" }),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    oldPassword: z.string({ message: "Old password is required" }),
    newPassword: z.string({ message: "New password is required" }),
  }),
});

const forgotPasswordZodSchema = z.object({
  body: z.object({
    email: z.string({ message: "Email is required" }).email(),
  }),
});

const resetPasswordZodSchema = z.object({
  body: z.object({
    token: z.string({ message: "Token is required" }),
    newPassword: z.string({ message: "New password is required" }),
  }),
});

export const AuthValidation = {
  registerUserZodSchema,
  loginUserZodSchema,
  changePasswordZodSchema,
  forgotPasswordZodSchema,
  resetPasswordZodSchema,
};
