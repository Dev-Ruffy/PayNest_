import { AuditAction } from "@prisma/client";
import { prisma } from "../config/db";
import { logger } from "../config/logger";

interface AuditParams {
  action: AuditAction;
  detail?: string;
  actorId?: string | null;
  schoolId?: string | null;
  ipAddress?: string | null;
}

/** Fire-and-forget audit trail entry. Never throws - logging must not break the request. */
export async function recordAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        detail: params.detail,
        actorId: params.actorId ?? undefined,
        schoolId: params.schoolId ?? undefined,
        ipAddress: params.ipAddress ?? undefined,
      },
    });
  } catch (err) {
    logger.error(`Failed to write audit log: ${(err as Error).message}`);
  }
}
