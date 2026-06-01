import { User } from "../../../../generated/prisma/client";

export interface TRegisterInput {
  name: string;
  email: string;
  password: string;
}

export type TRegisterResponse = Omit<User, "password">;

export interface TLoginInput {
  email: string;
  password: string;
}

export interface TLoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface TChangePasswordResponse {
  message: string;
}

export type TForgotPasswordResponse = string;
