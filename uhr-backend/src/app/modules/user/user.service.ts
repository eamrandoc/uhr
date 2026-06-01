import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import AppError from "../../errors/AppError";
import { User } from "../../../../generated/prisma/client";
import {
  TAddressResponse,
  TCreateAddressInput,
  TGetAllUsersQuery,
  TGetAllUsersResponse,
  TUpdateAddressInput,
  TUpdateProfileInput,
  TUpdateUserRoleInput,
  TUpdateUserStatusInput,
  TUserProfile,
} from "./user.interface";

// ==========================================
// 🛠️ Private Helpers
// ==========================================

/**
 * Fetches a user by ID, throws 404 if not found.
 * Does NOT validate status — used by admin operations too.
 */
const findUserById = async (id: string): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }
  return user;
};

/**
 * Strips sensitive fields before returning user data to clients.
 */
const sanitizeUser = (user: User): TUserProfile => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, resetPasswordToken, resetPasswordExpire, emailVerifyToken, ...safe } = user;
  return safe;
};

// ==========================================
// 👤 Profile Operations
// ==========================================

/**
 * Returns the authenticated user's own profile.
 */
const getMyProfile = async (userId: string): Promise<TUserProfile> => {
  const user = await findUserById(userId);
  return sanitizeUser(user);
};

/**
 * Updates the authenticated user's own profile fields.
 * Only name, phone, and avatar are user-editable.
 */
const updateMyProfile = async (
  userId: string,
  data: TUpdateProfileInput
): Promise<TUserProfile> => {
  await findUserById(userId);

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return sanitizeUser(updated);
};

// ==========================================
// 📍 Address Operations
// ==========================================

/**
 * Returns all addresses belonging to the authenticated user.
 */
const getMyAddresses = async (userId: string): Promise<TAddressResponse[]> => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
};

/**
 * Creates a new address for the authenticated user.
 * If the new address is marked as default, all other addresses are unset as default.
 */
const createAddress = async (
  userId: string,
  data: TCreateAddressInput
): Promise<TAddressResponse> => {
  // If setting as default, unset any existing default
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.address.create({
    data: { ...data, userId },
  });
};

/**
 * Updates an existing address.
 * Validates ownership before updating.
 * If setting as default, clears any previous default.
 */
const updateAddress = async (
  userId: string,
  addressId: string,
  data: TUpdateAddressInput
): Promise<TAddressResponse> => {
  // Verify address exists and belongs to the requesting user
  const address = await prisma.address.findUnique({ where: { id: addressId } });

  if (!address) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found!");
  }

  if (address.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to update this address!");
  }

  // If setting as default, unset previous default (except self)
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, NOT: { id: addressId } },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({
    where: { id: addressId },
    data,
  });
};

/**
 * Deletes an address.
 * Validates ownership before deletion.
 */
const deleteAddress = async (userId: string, addressId: string): Promise<void> => {
  const address = await prisma.address.findUnique({ where: { id: addressId } });

  if (!address) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found!");
  }

  if (address.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to delete this address!");
  }

  await prisma.address.delete({ where: { id: addressId } });
};

/**
 * Sets an address as the default for the user.
 * Validates ownership before updating.
 */
const setDefaultAddress = async (
  userId: string,
  addressId: string
): Promise<TAddressResponse> => {
  const address = await prisma.address.findUnique({ where: { id: addressId } });

  if (!address) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found!");
  }

  if (address.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to update this address!");
  }

  // Unset all current defaults for this user
  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  return prisma.address.update({
    where: { id: addressId },
    data: { isDefault: true },
  });
};

// ==========================================
// 🔧 Admin Operations
// ==========================================

/**
 * Returns a paginated, filterable list of all users.
 * Supports filtering by role and searching by name/email.
 */
const getAllUsers = async (query: TGetAllUsersQuery): Promise<TGetAllUsersResponse> => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  const whereClause = {
    isDeleted: false,
    ...(query.role && { role: query.role }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" as const } },
        { email: { contains: query.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [rawUsers, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    users: rawUsers.map(sanitizeUser),
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
  };
};

/**
 * Returns a single user's full profile by ID (admin use).
 */
const getUserById = async (id: string): Promise<TUserProfile> => {
  const user = await findUserById(id);
  return sanitizeUser(user);
};

/**
 * Updates a user's role (admin only).
 */
const updateUserRole = async (id: string, data: TUpdateUserRoleInput): Promise<TUserProfile> => {
  await findUserById(id);

  const updated = await prisma.user.update({
    where: { id },
    data: { role: data.role },
  });

  return sanitizeUser(updated);
};

/**
 * Bans, unbans, activates, or deactivates a user account (admin only).
 */
const updateUserStatus = async (
  id: string,
  data: TUpdateUserStatusInput
): Promise<TUserProfile> => {
  await findUserById(id);

  const updated = await prisma.user.update({
    where: { id },
    data,
  });

  return sanitizeUser(updated);
};

/**
 * Soft-deletes a user account (admin only).
 * The account is marked as deleted but not removed from the database.
 */
const deleteUser = async (id: string): Promise<void> => {
  const user = await findUserById(id);

  if (user.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is already deleted!");
  }

  await prisma.user.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  });
};

export const UserService = {
  // Profile
  getMyProfile,
  updateMyProfile,
  // Addresses
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  // Admin
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};
