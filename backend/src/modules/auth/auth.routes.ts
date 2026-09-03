import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authLimiter } from "../../middleware/rateLimiter.middleware";
import {
  registerSchoolSchema,
  verifySchoolSchema,
  developerLoginSchema,
  staffLoginSchema,
  housemasterLoginSchema,
  studentLoginSchema,
  registerStaffSchema,
} from "./auth.validation";

const router = Router();

router.post("/register-school", validate(registerSchoolSchema), authController.registerSchool);
router.post("/verify-school", validate(verifySchoolSchema), authController.verifySchool);

router.post("/login/developer", authLimiter, validate(developerLoginSchema), authController.developerLogin);
router.post("/login/staff", authLimiter, validate(staffLoginSchema), authController.staffLogin);
router.post("/login/housemaster", authLimiter, validate(housemasterLoginSchema), authController.housemasterLogin);
router.post("/login/student", authLimiter, validate(studentLoginSchema), authController.studentLogin);

router.post("/register/staff", validate(registerStaffSchema), authController.registerStaff);
// NOTE: public student self-registration has been intentionally removed. Student accounts are
// now created only by an Accountant (POST /accountant/students), a Housemaster
// (POST /housemaster/students), or a future bulk-import tool — all of which call
// authService.registerStudent() directly rather than going through this public route.

router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export default router;
