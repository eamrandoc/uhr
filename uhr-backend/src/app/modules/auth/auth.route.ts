import express from "express";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";


const router = express.Router();

router.post(
  "/register",
  validateRequest(AuthValidation.registerUserZodSchema),
  AuthController.registerUser
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginUserZodSchema),
  AuthController.loginUser
);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
  "/change-password",
  auth(), // Must be logged in
  validateRequest(AuthValidation.changePasswordZodSchema),
  AuthController.changePassword
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPasswordZodSchema),
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  validateRequest(AuthValidation.resetPasswordZodSchema),
  AuthController.resetPassword
);

export const AuthRoutes = router;
