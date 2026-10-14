import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { adminController } from "./admin.controller";
import { approvalDecisionSchema, changeHousemasterPasswordSchema, updateCreditLimitsSchema } from "./admin.validation";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/overview", adminController.overview);

router.get("/students", adminController.listStudents);
router.get("/students/:studentId/pin", adminController.viewStudentPin);

router.get("/transactions", adminController.listTransactions);

router.get("/staff", adminController.listStaff);
router.delete("/staff/:userId", adminController.deleteStaff);

router.get("/approvals", adminController.listApprovals);
router.post("/approvals/:userId/approve", validate(approvalDecisionSchema), adminController.approve);
router.post("/approvals/:userId/reject", validate(approvalDecisionSchema), adminController.reject);

router.put("/housemaster-password", validate(changeHousemasterPasswordSchema), adminController.changeHousemasterPassword);

router.get("/audit-logs", adminController.auditLogs);
router.get("/settings", adminController.settings);
router.put("/credit-limits", validate(updateCreditLimitsSchema), adminController.updateCreditLimits);
router.post("/reset-period", adminController.resetPeriod);

export default router;
