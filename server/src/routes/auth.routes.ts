import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import { validate } from "@/middleware/validate";
import {
  forgotPasswordSchema,
  loginSchema,
  registerDonorSchema,
  registerOrganizationSchema,
  resetPasswordSchema,
} from "@/schemas/auth.schema";
import { requireAuth } from "@/middleware/auth";
import { authLimiter } from "@/middleware/rateLimit";

const router = Router();

router.post("/register/donor", authLimiter, validate(registerDonorSchema), authController.registerDonor);
router.post(
  "/register/organization",
  authLimiter,
  validate(registerOrganizationSchema),
  authController.registerOrganization
);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
