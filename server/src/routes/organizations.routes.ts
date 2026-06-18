import { Router } from "express";
import * as organizationsController from "@/controllers/organizations.controller";
import { validate } from "@/middleware/validate";
import { searchOrganizationsSchema, updateOrganizationSchema } from "@/schemas/organization.schema";
import { attachUserIfPresent, requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.get("/search", attachUserIfPresent, validate(searchOrganizationsSchema, "query"), organizationsController.search);
router.get(
  "/me",
  requireAuth,
  requireRole("HOSPITAL", "BLOOD_BANK"),
  organizationsController.getMe
);
router.put(
  "/me",
  requireAuth,
  requireRole("HOSPITAL", "BLOOD_BANK"),
  validate(updateOrganizationSchema),
  organizationsController.updateMe
);
router.get("/:id", attachUserIfPresent, organizationsController.getById);

export default router;
