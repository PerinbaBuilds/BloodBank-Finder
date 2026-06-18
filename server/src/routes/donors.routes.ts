import { Router } from "express";
import * as donorsController from "@/controllers/donors.controller";
import { validate } from "@/middleware/validate";
import { searchDonorsSchema, updateDonorSchema } from "@/schemas/donor.schema";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/me", requireRole("DONOR"), donorsController.getMe);
router.put("/me", requireRole("DONOR"), validate(updateDonorSchema), donorsController.updateMe);
router.get(
  "/search",
  requireRole("HOSPITAL", "BLOOD_BANK", "ADMIN"),
  validate(searchDonorsSchema, "query"),
  donorsController.search
);

export default router;
