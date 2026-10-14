import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { batchController } from "./batch.controller";
import { createBatchSchema, addStudentsSchema, setStudentOrderSchema, applyProductSchema } from "./batch.validation";

const router = Router();

router.use(requireAuth, requireRole(Role.HOUSEMASTER));

router.post("/", validate(createBatchSchema), batchController.create);
router.get("/", batchController.list);
router.get("/:id", batchController.detail);
router.post("/:id/students", validate(addStudentsSchema), batchController.addStudents);
router.delete("/:id/students/:studentId", batchController.removeStudent);
router.put("/:id/students/:studentId/order", validate(setStudentOrderSchema), batchController.setStudentOrder);
router.post("/:id/apply-product", validate(applyProductSchema), batchController.applyProduct);
router.get("/:id/review", batchController.review);
router.post("/:id/confirm", batchController.confirm);
router.post("/:id/duplicate", batchController.duplicate);
router.delete("/:id", batchController.cancel);

export default router;
