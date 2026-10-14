import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import morgan from "morgan";

import { env } from "./config/env";
import { generalLimiter } from "./middleware/rateLimiter.middleware";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";

import authRoutes from "./modules/auth/auth.routes";
import schoolRoutes from "./modules/school/school.routes";
import developerRoutes from "./modules/developer/developer.routes";
import adminRoutes from "./modules/admin/admin.routes";
import accountantRoutes from "./modules/accountant/accountant.routes";
import housemasterRoutes from "./modules/housemaster/housemaster.routes";
import studentRoutes from "./modules/student/student.routes";
import sellerRoutes from "./modules/seller/seller.routes";
import batchRoutes from "./modules/batch/batch.routes";

export function createApp(): Application {
  const app = express();

  // Security & parsing middleware
  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN_LIST,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" })); // CSRF note: JWT bearer + SameSite=Lax cookies avoid classic CSRF exposure
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(hpp()); // guards against HTTP parameter pollution
  app.use(generalLimiter);

  if (!env.isProd) {
    app.use(morgan("dev"));
  }

  // Health check (unauthenticated, used by Render/Railway)
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }));

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/schools", schoolRoutes);
  app.use("/api/developer", developerRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/accountant", accountantRoutes);
  app.use("/api/housemaster", housemasterRoutes);
  app.use("/api/student", studentRoutes);
  app.use("/api/seller", sellerRoutes);
  app.use("/api/housemaster/batches", batchRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
