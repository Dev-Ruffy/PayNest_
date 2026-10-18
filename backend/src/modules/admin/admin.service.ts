import { Role, StaffApprovalStatus } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { generateSharedPassword } from "../../utils/generateCode.util";
import { hashValue } from "../../utils/bcrypt.util";
import { recordAudit } from "../../utils/auditLog.util";
import { emailService } from "../../utils/email.util";

export const adminService = {
  async getOverview(schoolId: string) {
    const [studentCount, accountant, housemasterCount, seller, transactionCount, pendingApprovals, students] =
      await Promise.all([
        prisma.student.count({ where: { schoolId } }),
        prisma.user.findFirst({ where: { schoolId, role: Role.ACCOUNTANT } }),
        prisma.user.count({ where: { schoolId, role: Role.HOUSEMASTER } }),
        prisma.user.findFirst({ where: { schoolId, role: Role.SELLER } }),
        prisma.transaction.count({ where: { schoolId } }),
        prisma.user.count({
          where: { schoolId, role: { in: [Role.ACCOUNTANT, Role.SELLER] }, approvalStatus: StaffApprovalStatus.PENDING },
        }),
        prisma.student.findMany({ where: { schoolId }, select: { walletBalance: true } }),
      ]);

    const totalStudentWalletBalance = students.reduce((sum: number, s: { walletBalance: unknown }) => sum + Number(s.walletBalance), 0);

    return {
      studentCount,
      accountantOnboarded: !!accountant,
      housemasterCount,
      sellerOnboarded: !!seller,
      transactionCount,
      pendingApprovals,
      totalStudentWalletBalance,
    };
  },

  async listStaff(schoolId: string) {
    return prisma.user.findMany({
      where: { schoolId, role: { in: [Role.ACCOUNTANT, Role.HOUSEMASTER, Role.SELLER] } },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        approvalStatus: true,
        isActive: true,
        walletBalance: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async listPendingApprovals(schoolId: string) {
    return prisma.user.findMany({
      where: { schoolId, role: { in: [Role.ACCOUNTANT, Role.SELLER] }, approvalStatus: StaffApprovalStatus.PENDING },
      select: { id: true, fullName: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  },

  async decideApproval(schoolId: string, userId: string, approve: boolean, reason: string | undefined, actorId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, schoolId, role: { in: [Role.ACCOUNTANT, Role.SELLER] } } });
    if (!user) throw ApiError.notFound("Pending staff registration not found.");
    if (user.approvalStatus !== StaffApprovalStatus.PENDING) {
      throw ApiError.badRequest("This registration has already been reviewed.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: approve ? StaffApprovalStatus.APPROVED : StaffApprovalStatus.REJECTED },
    });

    await recordAudit({
      action: approve ? "STAFF_APPROVED" : "STAFF_REJECTED",
      actorId,
      schoolId,
      detail: `${user.role} ${user.fullName}${reason ? ` - ${reason}` : ""}`,
    });

    if (user.email) {
      await emailService.notifyStaffApproval(user.email, user.fullName, user.role, approve);
    }

    return { message: `${user.role} ${approve ? "approved" : "rejected"}.` };
  },

  async deleteStaff(schoolId: string, userId: string, actorId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, schoolId, role: { in: [Role.ACCOUNTANT, Role.HOUSEMASTER, Role.SELLER] } },
    });
    if (!user) throw ApiError.notFound("Staff member not found.");

    await prisma.user.delete({ where: { id: userId } });

    await recordAudit({
      action: "STAFF_DELETED",
      actorId,
      schoolId,
      detail: `${user.role} ${user.fullName} removed - signup slot is now available again`,
    });

    return { message: `${user.fullName} has been removed. The ${user.role.toLowerCase()} slot is now open for a new signup.` };
  },


  async changeHousemasterPassword(schoolId: string, actorId: string, newPassword?: string) {
    const password = newPassword ?? generateSharedPassword();
    const hash = await hashValue(password);

    await prisma.school.update({ where: { id: schoolId }, data: { housemasterPasswordHash: hash } });

    await recordAudit({ action: "HOUSEMASTER_PASSWORD_CHANGED", actorId, schoolId });

    return { newPassword: password, message: "Shared Housemaster password updated. Share the new password with your Housemasters." };
  },

  async listAuditLogs(schoolId: string, page = 1, pageSize = 30) {
    const where = { schoolId };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { fullName: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  async getSchoolSettings(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        registrantName: true,
        registrantDesignation: true,
        createdAt: true,
        creditPeriodType: true,
        creditPeriodMaxAmount: true,
        currentPeriodStartedAt: true,
        dailySpendMaxAmount: true,
      },
    });
    if (!school) throw ApiError.notFound("School not found.");
    return school;
  },

  async updateCreditLimits(params: {
    schoolId: string;
    actorId: string;
    creditPeriodType?: "TERM" | "SESSION" | null;
    creditPeriodMaxAmount?: number | null;
    dailySpendMaxAmount?: number | null;
  }) {
    const hasPeriodType = params.creditPeriodType !== undefined && params.creditPeriodType !== null;
    const hasPeriodMax = params.creditPeriodMaxAmount !== undefined && params.creditPeriodMaxAmount !== null;
    if (hasPeriodType !== hasPeriodMax) {
      throw ApiError.badRequest("Choose both a period type and a maximum amount, or clear both.");
    }

    const school = await prisma.school.update({
      where: { id: params.schoolId },
      data: {
        creditPeriodType: params.creditPeriodType ?? null,
        creditPeriodMaxAmount: params.creditPeriodMaxAmount ?? null,
        dailySpendMaxAmount: params.dailySpendMaxAmount ?? null,
        ...(hasPeriodMax ? { currentPeriodStartedAt: new Date() } : { currentPeriodStartedAt: null }),
      },
    });

    await recordAudit({ action: "CREDIT_LIMIT_UPDATED", actorId: params.actorId, schoolId: params.schoolId });
    return school;
  },

  /** Marks "a new term/session has begun" - resets the window the period credit limit counts within. */
  async resetPeriod(schoolId: string, actorId: string) {
    const school = await prisma.school.update({ where: { id: schoolId }, data: { currentPeriodStartedAt: new Date() } });
    await recordAudit({ action: "PERIOD_RESET", actorId, schoolId });
    return { message: "New period started. Credit limits now count from today.", currentPeriodStartedAt: school.currentPeriodStartedAt };
  },
};
