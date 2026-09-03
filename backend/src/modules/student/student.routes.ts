import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { studentController } from "./student.controller";

const router = Router();

router.use(requireAuth, requireRole(Role.STUDENT));

router.get("/me", studentController.me);
router.get("/transactions", studentController.transactions);

export default router;
