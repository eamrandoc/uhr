import { Request, Response } from "express";
import httpStatus from "http-status";
import { UserService } from "./user.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Role } from "../../../../generated/prisma/client";

// ─── Profile ────────────────────────────────────────────────────────────────

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId as string;
  const result = await UserService.getMyProfile(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully!",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId as string;
  const result = await UserService.updateMyProfile(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully!",
    data: result,
  });
});

// ─── Addresses ──────────────────────────────────────────────────────────────

const getMyAddresses = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId as string;
  const result = await UserService.getMyAddresses(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Addresses retrieved successfully!",
    data: result,
  });
});

const createAddress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId as string;
  const result = await UserService.createAddress(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Address created successfully!",
    data: result,
  });
});

const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId as string;
  const addressId = req.params.addressId as string;
  const result = await UserService.updateAddress(userId, addressId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Address updated successfully!",
    data: result,
  });
});

const deleteAddress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId as string;
  const addressId = req.params.addressId as string;
  await UserService.deleteAddress(userId, addressId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Address deleted successfully!",
    data: null,
  });
});

const setDefaultAddress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId as string;
  const addressId = req.params.addressId as string;
  const result = await UserService.setDefaultAddress(userId, addressId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Default address updated successfully!",
    data: result,
  });
});

// ─── Admin ──────────────────────────────────────────────────────────────────

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page as string | undefined;
  const limit = req.query.limit as string | undefined;
  const role = req.query.role as Role | undefined;
  const search = req.query.search as string | undefined;

  const result = await UserService.getAllUsers({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    role,
    search,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully!",
    meta: result.meta,
    data: result.users,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserService.getUserById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully!",
    data: result,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserService.updateUserRole(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role updated successfully!",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserService.updateUserStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully!",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await UserService.deleteUser(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully!",
    data: null,
  });
});

export const UserController = {
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
