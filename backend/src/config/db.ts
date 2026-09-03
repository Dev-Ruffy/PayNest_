import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Single Prisma Client instance shared across the app (prevents
// connection-pool exhaustion under ts-node-dev / nodemon reloads).
declare global {
  // eslint-disable-next-line no-var
  var __PAYNEST_PRISMA__: PrismaClient | undefined;
}

export const prisma =
  global.__PAYNEST_PRISMA__ ??
  new PrismaClient({
    log: env.isProd ? ["error", "warn"] : ["query", "error", "warn"],
  });

if (!env.isProd) {
  global.__PAYNEST_PRISMA__ = prisma;
}
