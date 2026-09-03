import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { accountantController } from "./accountant.controller";
import { creditStudentSchema, createStudentSchema } from "./accountant.validation";

const router = Router();

router.use(requireAuth, requireRole(Role.ACCOUNTANT));

router.post("/students", validate(createStudentSchema), accountantController.createStudent);
router.get("/students", accountantController.listStudents);
router.post("/credit", validate(creditStudentSchema), accountantController.creditStudent);
router.get("/credit-history", accountantController.creditHistory);
router.get("/transactions", accountantController.allTransactions);

export default router;
