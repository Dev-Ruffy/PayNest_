import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { authLimiter } from "../../middleware/rateLimiter.middleware";
import { sellerController } from "./seller.controller";
import { purchaseSchema } from "./seller.validation";

const router = Router();

router.use(requireAuth, requireRole(Role.SELLER));

router.get("/wallet", sellerController.wallet);
router.get("/students", sellerController.searchStudents);
router.post("/purchase", authLimiter, validate(purchaseSchema), sellerController.purchase);
router.get("/transactions", sellerController.transactions);

export default router;
