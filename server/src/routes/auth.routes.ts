import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import { validate } from "@/middleware/validate";
import { loginSchema, registerDonorSchema, registerOrganizationSchema } from "@/schemas/auth.schema";
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
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
