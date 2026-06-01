import { Address, Role, User } from "../../../../generated/prisma/client";

// ─── Profile ────────────────────────────────────────────────────────────────

/** Fields a user can update on their own profile */
export interface TUpdateProfileInput {
  name?: string;
  phone?: string;
  avatar?: string;
}

/** Public-safe user profile (password excluded) */
export type TUserProfile = Omit<User, "password" | "resetPasswordToken" | "resetPasswordExpire" | "emailVerifyToken">;

// ─── Address ────────────────────────────────────────────────────────────────

export interface TCreateAddressInput {
  fullName: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  isDefault?: boolean;
}

export interface TUpdateAddressInput {
  fullName?: string;
  phone?: string;
  city?: string;
  area?: string;
  street?: string;
  isDefault?: boolean;
}

export type TAddressResponse = Address;

// ─── Admin ──────────────────────────────────────────────────────────────────

export interface TGetAllUsersQuery {
  page?: number;
  limit?: number;
  role?: Role;
  search?: string;
}

export interface TGetAllUsersResponse {
  users: TUserProfile[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
}

export interface TUpdateUserRoleInput {
  role: Role;
}

export interface TUpdateUserStatusInput {
  isBanned?: boolean;
  isActive?: boolean;
}
