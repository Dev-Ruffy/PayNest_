import { Router } from "express";
import { schoolController } from "./school.controller";

const router = Router();

router.get("/", schoolController.listActive);
router.get("/:id/status", schoolController.status);

export default router;
