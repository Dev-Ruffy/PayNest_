import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { housemasterController } from "./housemaster.controller";
import { creditStudentSchema, createStudentSchema } from "../accountant/accountant.validation";

const router = Router();

router.use(requireAuth, requireRole(Role.HOUSEMASTER));

router.post("/students", validate(createStudentSchema), housemasterController.createStudent);
router.get("/students", housemasterController.listStudents);
router.get("/students/groupings", housemasterController.studentGroupings);
router.post("/credit", validate(creditStudentSchema), housemasterController.creditStudent);
router.get("/transactions", housemasterController.transactions);
router.get("/products", housemasterController.listProducts);

export default router;
