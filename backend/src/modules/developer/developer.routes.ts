import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { developerController } from "./developer.controller";
import { createSchoolSchema, rejectSchoolSchema, updateSettingSchema } from "./developer.validation";

const router = Router();

router.use(requireAuth, requireRole(Role.DEVELOPER));

router.get("/overview", developerController.overview);
router.get("/health", developerController.apiHealth);
router.get("/database-overview", developerController.databaseOverview);
router.get("/storage-overview", developerController.storageOverview);

router.get("/schools", developerController.listSchools);
router.get("/schools/trash", developerController.listDeletedSchools);
router.get("/schools/:id", developerController.getSchool);
router.post("/schools", validate(createSchoolSchema), developerController.createSchool);
router.delete("/schools/:id", developerController.deleteSchool);
router.post("/schools/:id/restore", developerController.restoreSchool);
router.delete("/schools/:id/permanent", developerController.permanentlyDeleteSchool);

router.get("/verification-requests", developerController.listVerificationRequests);
router.post("/verification-requests/:id/approve", developerController.approveSchool);
router.post("/verification-requests/:id/reject", validate(rejectSchoolSchema), developerController.rejectSchool);

router.get("/transactions", developerController.listAllTransactions);
router.get("/active-users", developerController.listActiveUsers);
router.get("/failed-logins", developerController.listFailedLogins);
router.get("/audit-logs", developerController.listAuditLogs);

router.get("/settings", developerController.getSettings);
router.put("/settings/:key", validate(updateSettingSchema), developerController.updateSetting);

export default router;
