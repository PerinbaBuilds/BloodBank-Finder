import { Router } from "express";
import * as ambulanceController from "@/controllers/ambulance.controller";
import { validate } from "@/middleware/validate";
import {
  createAmbulanceRequestSchema,
  createAmbulanceSchema,
  listAmbulanceRequestsSchema,
  updateAmbulanceRequestSchema,
  updateAmbulanceSchema,
} from "@/schemas/ambulance.schema";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.use(requireAuth);

router.post(
  "/requests",
  requireRole("HOSPITAL", "BLOOD_BANK"),
  validate(createAmbulanceRequestSchema),
  ambulanceController.createAmbulanceRequest
);
router.get(
  "/requests",
  requireRole("HOSPITAL", "BLOOD_BANK"),
  validate(listAmbulanceRequestsSchema, "query"),
  ambulanceController.listAmbulanceRequests
);
router.get("/requests/:id", ambulanceController.getAmbulanceRequest);
router.patch(
  "/requests/:id",
  requireRole("HOSPITAL", "BLOOD_BANK"),
  validate(updateAmbulanceRequestSchema),
  ambulanceController.updateAmbulanceRequest
);

router.post(
  "/",
  requireRole("HOSPITAL", "BLOOD_BANK"),
  validate(createAmbulanceSchema),
  ambulanceController.createAmbulance
);
router.get("/", requireRole("HOSPITAL", "BLOOD_BANK"), ambulanceController.listAmbulances);
router.patch(
  "/:id",
  requireRole("HOSPITAL", "BLOOD_BANK"),
  validate(updateAmbulanceSchema),
  ambulanceController.updateAmbulance
);

export default router;
