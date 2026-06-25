import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/scripts/seedData";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
