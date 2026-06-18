import http from "http";
import { createApp } from "@/app";
import { env } from "@/config/env";
import { initSocket } from "@/sockets";
import { prisma } from "@/config/prisma";

const app = createApp();
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`BloodBank Finder API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown() {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
