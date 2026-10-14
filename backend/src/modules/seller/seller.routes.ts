import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { authLimiter } from "../../middleware/rateLimiter.middleware";
import { sellerController } from "./seller.controller";
import { purchaseSchema } from "./seller.validation";
import { productController } from "../product/product.controller";
import { createProductSchema, updateProductSchema } from "../product/product.validation";

const router = Router();

router.use(requireAuth, requireRole(Role.SELLER));

router.get("/wallet", sellerController.wallet);
router.get("/balance-history", sellerController.balanceHistory);
router.get("/students", sellerController.searchStudents);
router.post("/purchase", authLimiter, validate(purchaseSchema), sellerController.purchase);
router.get("/transactions", sellerController.transactions);

router.get("/products", productController.listAll);
router.post("/products", validate(createProductSchema), productController.create);
router.put("/products/:id", validate(updateProductSchema), productController.update);

router.get("/batch-orders", sellerController.listBatchOrders);
router.get("/batch-orders/:id", sellerController.batchOrderDetail);

export default router;
