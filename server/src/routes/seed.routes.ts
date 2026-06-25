import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { env } from "@/config/env";
import { seedDatabase } from "@/scripts/seedData";

const router = Router();

router.post("/", async (req, res) => {
  if (!env.SEED_SECRET) {
    return res.status(404).json({ error: "Not found" });
  }

  const provided = req.header("x-seed-secret");
  if (!provided || provided !== env.SEED_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const prisma = new PrismaClient();
  try {
    const summary = await seedDatabase(prisma);
    res.json({ ok: true, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "Seed failed" });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;
