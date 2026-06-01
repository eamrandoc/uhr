import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../errors/AppError";
import { prisma } from "../../lib/prisma";
import { jwtHelpers } from "../../helpers/jwtHelpers";

const auth = (...requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Get Authorization token (supports both PascalCase and lowercase cookie property or Authorization header)
      const token =
        req.cookies?.accessToken ||
        req.headers.authorization;

      if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      // Check if it's a Bearer token
      let jwtToken = token;
      if (token.startsWith("Bearer ")) {
        jwtToken = token.split(" ")[1];
      }

      // 2. Verify token using jwtHelpers
      const decoded = jwtHelpers.verifyToken(
        jwtToken,
        "access"
      );
      if (!decoded) {
        throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }
      const { userId, role } = decoded;

      // 3. Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError(httpStatus.FORBIDDEN, "This account is inactive!");
      }

      // 4. Check if user is banned
      if (user.isBanned) {
        throw new AppError(httpStatus.FORBIDDEN, "This user is banned!");
      }

      // 5. Check if user is deleted
      if (user.isDeleted) {
        throw new AppError(httpStatus.FORBIDDEN, "This user is deleted!");
      }

      // 6. Check role authority
      if (requiredRoles.length && !requiredRoles.includes(role)) {
        throw new AppError(httpStatus.FORBIDDEN, "You have no access to this resource!");
      }

      // 7. Attach to request
      req.user = decoded;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
