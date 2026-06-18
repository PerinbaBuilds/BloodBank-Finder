import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env, isProduction, isTest } from "@/config/env";
import { notFoundHandler, errorHandler } from "@/middleware/errorHandler";
import { apiLimiter } from "@/middleware/rateLimit";
import authRoutes from "@/routes/auth.routes";
import donorRoutes from "@/routes/donors.routes";
import organizationRoutes from "@/routes/organizations.routes";
import inventoryRoutes from "@/routes/inventory.routes";
import requestRoutes from "@/routes/requests.routes";
import notificationRoutes from "@/routes/notifications.routes";
import statsRoutes from "@/routes/stats.routes";
import adminRoutes from "@/routes/admin.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  if (!isProduction && !isTest) {
    app.use(morgan("dev"));
  }
  app.use(apiLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.use("/api/auth", authRoutes);
  app.use("/api/donors", donorRoutes);
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/stats", statsRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
