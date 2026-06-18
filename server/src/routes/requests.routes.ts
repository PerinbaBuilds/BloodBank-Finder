import { Router } from "express";
import * as requestsController from "@/controllers/requests.controller";
import { validate } from "@/middleware/validate";
import { createRequestSchema, listRequestsSchema, updateRequestSchema, updateResponseSchema } from "@/schemas/request.schema";
import { requireAuth, requireRole } from "@/middleware/auth";
import { requestCreationLimiter } from "@/middleware/rateLimit";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  requireRole("HOSPITAL", "BLOOD_BANK"),
  requestCreationLimiter,
  validate(createRequestSchema),
  requestsController.createRequest
);
router.get("/", validate(listRequestsSchema, "query"), requestsController.listRequests);
router.get("/:id", requestsController.getRequest);
router.patch(
  "/:id",
  requireRole("HOSPITAL", "BLOOD_BANK"),
  validate(updateRequestSchema),
  requestsController.updateRequest
);
router.post("/:id/responses", requireRole("DONOR"), requestsController.respondToRequest);
router.patch(
  "/:id/responses/:responseId",
  validate(updateResponseSchema),
  requestsController.updateResponse
);

export default router;
