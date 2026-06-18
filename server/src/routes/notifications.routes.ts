import { Router } from "express";
import * as notificationsController from "@/controllers/notifications.controller";
import { requireAuth } from "@/middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", notificationsController.list);
router.patch("/read-all", notificationsController.markAllRead);
router.patch("/:id/read", notificationsController.markRead);

export default router;
