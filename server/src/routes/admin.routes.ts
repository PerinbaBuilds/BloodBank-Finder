import { Router } from "express";
import * as adminController from "@/controllers/admin.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/organizations", adminController.listOrganizations);
router.patch("/organizations/:id/verify", adminController.verifyOrganization);

export default router;
