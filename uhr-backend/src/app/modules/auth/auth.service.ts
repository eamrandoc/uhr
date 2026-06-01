import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import AppError from "../../errors/AppError";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import { passwordHelpers } from "../../../helpers/passwordHelpers";
import { User } from "../../../../generated/prisma/client";
import {
  TChangePasswordInput,
  TChangePasswordResponse,
  TForgotPasswordResponse,
  TLoginInput,
  TLoginResponse,
  TRefreshTokenResponse,
  TRegisterInput,
  TRegisterResponse,
} from "./auth.interface";

// ==========================================
// 🛡️ User Validation & Fetching Helpers
// ==========================================

/**
 * Centrally validates the active, ban, and soft-delete statuses of a user.
 * Prevents inactive, banned, or deleted accounts from performing operations.
 */
const validateUserStatus = (user: User): void => {
  if (!user.isActive) {
    throw new AppError(httpStatus.FORBIDDEN, "This account is inactive!");
  }
  if (user.isBanned) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is banned!");
  }
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is deleted!");
  }
};

/**
 * Centrally fetches a user by their ID and validates their status.
 * Throws a standard 404 error if not found.
 */
const findUserByIdAndValidate = async (id: string): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  validateUserStatus(user);
  return user;
};

// ==========================================
// 🔐 Core Authentication Service Methods
// ==========================================

const registerUser = async (data: TRegisterInput): Promise<TRegisterResponse> => {
  const { name, email, password } = data;

  // 1. Check user uniqueness
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exists with this email!");
  }

  // 2. Hash password utilizing helper & env-controlled salt rounds
  const hashedPassword = await passwordHelpers.hashPassword(password);

  // 3. Create user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      provider: "EMAIL",
    },
  });

  // 4. Return user excluding hashed password
  const { password: _, ...result } = newUser;
  return result;
};

const loginUser = async (data: TLoginInput): Promise<TLoginResponse> => {
  const { email, password } = data;

  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Throw 401 Unauthorized for security (generic error avoids leaking email existence)
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password!");
  }

  // 2. Centrally validate user active status, bans, and soft-delete state
  validateUserStatus(user);

  // 3. Verify password
  if (!user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account does not have a password configured (registered via Social Login)."
    );
  }

  const isPasswordMatch = await passwordHelpers.comparePassword(password, user.password);
  if (!isPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password!");
  }

  // 4. Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 5. Generate secure JWT tokens
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtHelpers.createToken(payload, "access");
  const refreshToken = jwtHelpers.createToken(payload, "refresh");

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string): Promise<TRefreshTokenResponse> => {
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is missing!");
  }

  // 1. Verify token authenticity and expiry
  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(token, "refresh");
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token!");
  }

  const { userId } = decoded;

  // 2. Retrieve user and validate status via central helper
  const user = await findUserByIdAndValidate(userId);

  // 3. Generate new access & refresh token pair
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtHelpers.createToken(payload, "access");
  const newRefreshToken = jwtHelpers.createToken(payload, "refresh");

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

const changePassword = async (
  userId: string,
  data: TChangePasswordInput
): Promise<TChangePasswordResponse> => {
  const { oldPassword, newPassword } = data;

  // 1. Fetch user and validate active status
  const user = await findUserByIdAndValidate(userId);

  if (!user.password) {
    throw new AppError(httpStatus.BAD_REQUEST, "This account does not have a password configured.");
  }

  // 2. Verify current password
  const isPasswordMatch = await passwordHelpers.comparePassword(oldPassword, user.password);
  if (!isPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old password is incorrect!");
  }

  // 3. Hash and store new password
  const hashedPassword = await passwordHelpers.hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully" };
};

const forgotPassword = async (email: string): Promise<TForgotPasswordResponse> => {
  // 1. Fetch user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "No user found with this email!");
  }

  // Validate status
  validateUserStatus(user);

  // Verify registration provider
  if (user.provider !== "EMAIL") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Password reset is not available for social login accounts"
    );
  }

  // 2. Generate secure one-time reset token
  const payload = {
    userId: user.id,
    email: user.email,
  };

  const resetToken = jwtHelpers.createToken(payload, "reset");

  // 3. Store reset token with 1-hour expiration
  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + 1);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpire: expirationTime,
    },
  });

  return resetToken;
};

const resetPassword = async (token: string, newPassword: string): Promise<null> => {
  // 1. Verify token
  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(token, "reset");
  } catch (error) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired reset token!");
  }

  const { userId } = decoded;

  // 2. Find matching user, confirming valid token and future expiry
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      resetPasswordToken: token,
      resetPasswordExpire: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired reset token!");
  }

  // Validate status
  validateUserStatus(user);

  // 3. Hash and store new password, clearing reset fields
  const hashedPassword = await passwordHelpers.hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpire: null,
    },
  });

  return null;
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};


