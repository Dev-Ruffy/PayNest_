import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/** General API rate limit — generous, protects against abuse/scraping. */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

/** Tighter limit on auth/login/PIN endpoints to slow brute-force attempts. */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please wait before trying again." },
});
