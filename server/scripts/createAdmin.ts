import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function generatePassword(length = 20) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((byte) => chars[byte % chars.length])
    .join("");
}

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@bloodbankfinder.org";
  const phone = process.env.ADMIN_PHONE || "+91-9000000000";
  const password = process.env.ADMIN_PASSWORD || generatePassword();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`A user with email ${email} already exists (role: ${existing.role}). Not modifying it.`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, phone, role: "ADMIN", passwordHash },
  });

  console.log("Admin account created.");
  console.log(`Email:    ${user.email}`);
  console.log(`Password: ${password}`);
  console.log("Save this password now - it will not be shown again.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
