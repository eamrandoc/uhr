import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

// ─── My Profile ─────────────────────────────────────────────────────────────

/** GET /users/me — Get the authenticated user's own profile */
router.get("/me", auth(), UserController.getMyProfile);

/** PATCH /users/me — Update the authenticated user's own profile */
router.patch(
  "/me",
  auth(),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateMyProfile
);

// ─── My Addresses ───────────────────────────────────────────────────────────

/** GET /users/me/addresses — Get all addresses of the authenticated user */
router.get("/me/addresses", auth(), UserController.getMyAddresses);

/** POST /users/me/addresses — Create a new address */
router.post(
  "/me/addresses",
  auth(),
  validateRequest(UserValidation.createAddressZodSchema),
  UserController.createAddress
);

/** PATCH /users/me/addresses/:addressId — Update an address */
router.patch(
  "/me/addresses/:addressId",
  auth(),
  validateRequest(UserValidation.updateAddressZodSchema),
  UserController.updateAddress
);

/** DELETE /users/me/addresses/:addressId — Delete an address */
router.delete("/me/addresses/:addressId", auth(), UserController.deleteAddress);

/** PATCH /users/me/addresses/:addressId/default — Set address as default */
router.patch(
  "/me/addresses/:addressId/default",
  auth(),
  UserController.setDefaultAddress
);

// ─── Admin Routes ────────────────────────────────────────────────────────────

/** GET /users — Get all users (Admin/Super Admin only) */
router.get("/", auth("ADMIN", "SUPER_ADMIN"), UserController.getAllUsers);

/** GET /users/:id — Get a single user by ID (Admin/Super Admin only) */
router.get("/:id", auth("ADMIN", "SUPER_ADMIN"), UserController.getUserById);

/** PATCH /users/:id/role — Update a user's role (Super Admin only) */
router.patch(
  "/:id/role",
  auth("SUPER_ADMIN"),
  validateRequest(UserValidation.updateUserRoleZodSchema),
  UserController.updateUserRole
);

/** PATCH /users/:id/status — Ban/activate a user (Admin/Super Admin only) */
router.patch(
  "/:id/status",
  auth("ADMIN", "SUPER_ADMIN"),
  validateRequest(UserValidation.updateUserStatusZodSchema),
  UserController.updateUserStatus
);

/** DELETE /users/:id — Soft-delete a user (Super Admin only) */
router.delete("/:id", auth("SUPER_ADMIN"), UserController.deleteUser);

export const UserRoutes = router;
