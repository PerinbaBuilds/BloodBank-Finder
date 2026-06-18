import { Router } from "express";
import * as statsController from "@/controllers/stats.controller";

const router = Router();

router.get("/overview", statsController.overview);

export default router;
