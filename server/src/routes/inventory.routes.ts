import { Router } from "express";
import * as inventoryController from "@/controllers/inventory.controller";
import { validate } from "@/middleware/validate";
import { upsertInventorySchema } from "@/schemas/inventory.schema";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("BLOOD_BANK"));

router.get("/me", inventoryController.getMine);
router.put("/me", validate(upsertInventorySchema), inventoryController.upsertMine);

export default router;
