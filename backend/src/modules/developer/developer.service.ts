import { Role, SchoolStatus, StaffApprovalStatus, AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { hashValue } from "../../utils/bcrypt.util";
import { generateNumericCode, generateSharedPassword } from "../../utils/generateCode.util";
import { emailService } from "../../utils/email.util";
import { recordAudit } from "../../utils/auditLog.util";

const VERIFICATION_CODE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const developerService = {
  async getOverview() {
    const [
      totalSchools,
      activeSchools,
      pendingSchools,
      totalStudents,
      totalStaff,
      totalTransactions,
      students,
      recentFailedLogins,
    ] = await Promise.all([
      prisma.school.count({ where: { deletedAt: null } }),
      prisma.school.count({ where: { status: SchoolStatus.ACTIVE, deletedAt: null } }),
      prisma.school.count({ where: { status: SchoolStatus.PENDING_VERIFICATION, deletedAt: null } }),
      prisma.student.count(),
      prisma.user.count({ where: { role: { in: [Role.ADMIN, Role.ACCOUNTANT, Role.HOUSEMASTER, Role.SELLER] } } }),
      prisma.transaction.count(),
      prisma.student.findMany({ select: { walletBalance: true } }),
      prisma.failedLogin.count({ where: { createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);

    const totalWalletBalance = students.reduce((sum: number, s: { walletBalance: unknown }) => sum + Number(s.walletBalance), 0);

    return {
      totalSchools,
      activeSchools,
      pendingSchools,
      totalStudents,
      totalStaff,
      totalTransactions,
      totalWalletBalance,
      recentFailedLogins,
    };
  },

  async listSchools() {
    const schools = await prisma.school.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        registrantName: true,
        registrantDesignation: true,
        createdAt: true,
        _count: { select: { users: true, students: true, transactions: true } },
      },
    });
    return schools;
  },

  /** Schools currently in the trash — soft-deleted, but fully intact and restorable. */
  async listDeletedSchools() {
    const schools = await prisma.school.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        registrantName: true,
        registrantDesignation: true,
        createdAt: true,
        deletedAt: true,
        _count: { select: { users: true, students: true, transactions: true } },
      },
    });
    return schools;
  },

  async getSchool(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        users: { select: { id: true, fullName: true, role: true, approvalStatus: true, isActive: true, createdAt: true } },
        _count: { select: { students: true, transactions: true } },
      },
    });
    if (!school) throw ApiError.notFound("School not found.");
    return school;
  },

  /** Developer bootstraps a school directly (skips the public registration form). */
  async createSchool(input: {
    registrantName: string;
    registrantDesignation: string;
    schoolName: string;
    schoolEmail: string;
    username: string;
    password: string;
    autoActivate?: boolean;
    creditPeriodType?: "TERM" | "SESSION";
    creditPeriodMaxAmount?: number;
    dailySpendMaxAmount?: number;
  }) {
    const existing = await prisma.school.findUnique({ where: { email: input.schoolEmail } });
    if (existing) throw ApiError.conflict("A school with this email already exists.");

    const passwordHash = await hashValue(input.password);
    const sharedPassword = generateSharedPassword();
    const sharedPasswordHash = await hashValue(sharedPassword);

    const school = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.school.create({
        data: {
          name: input.schoolName,
          email: input.schoolEmail,
          registrantName: input.registrantName,
          registrantDesignation: input.registrantDesignation,
          registrantUsername: input.username,
          status: input.autoActivate ? SchoolStatus.ACTIVE : SchoolStatus.PENDING_VERIFICATION,
          housemasterPasswordHash: sharedPasswordHash,
          creditPeriodType: input.creditPeriodType,
          creditPeriodMaxAmount: input.creditPeriodMaxAmount,
          dailySpendMaxAmount: input.dailySpendMaxAmount,
          currentPeriodStartedAt: input.creditPeriodMaxAmount ? new Date() : undefined,
        },
      });

      await tx.user.create({
        data: {
          role: Role.ADMIN,
          fullName: input.registrantName,
          username: input.username,
          passwordHash,
          schoolId: created.id,
          isActive: !!input.autoActivate,
        },
      });

      if (!input.autoActivate) {
        await tx.verificationRequest.create({ data: { schoolId: created.id, status: StaffApprovalStatus.PENDING } });
      }

      return created;
    });

    await recordAudit({ action: "SCHOOL_REGISTERED", schoolId: school.id, detail: `Created directly by developer` });

    return { school, sharedPassword: input.autoActivate ? sharedPassword : undefined };
  },

  /**
   * Moves a school to the trash instead of destroying it — nothing about the
   * school, its users, students or transactions is touched. This is the
   * "undo-able" delete used from the main Schools list.
   */
  async deleteSchool(schoolId: string, developerId: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw ApiError.notFound("School not found.");
    if (school.deletedAt) throw ApiError.badRequest("This school is already in the trash.");

    await prisma.school.update({ where: { id: schoolId }, data: { deletedAt: new Date() } });
    await recordAudit({
      action: "SCHOOL_DELETED",
      actorId: developerId,
      schoolId,
      detail: `${school.name} moved to trash by developer`,
    });

    return { message: `${school.name} has been moved to the trash. You can restore it any time from the Trash tab.` };
  },

  /** Undoes a deleteSchool — the school and everything in it becomes visible/usable again. */
  async restoreSchool(schoolId: string, developerId: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw ApiError.notFound("School not found.");
    if (!school.deletedAt) throw ApiError.badRequest("This school isn't in the trash.");

    await prisma.school.update({ where: { id: schoolId }, data: { deletedAt: null } });
    await recordAudit({
      action: "SCHOOL_RESTORED",
      actorId: developerId,
      schoolId,
      detail: `${school.name} restored from trash`,
    });

    return { message: `${school.name} has been restored.` };
  },

  /**
   * The true, irreversible delete — only callable on a school that's already
   * in the trash, as a deliberate second, separately-confirmed step. This
   * cascades and destroys every user, student, transaction and log tied to
   * the school; there is no recovering from this one.
   */
  async permanentlyDeleteSchool(schoolId: string, developerId: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw ApiError.notFound("School not found.");
    if (!school.deletedAt) {
      throw ApiError.badRequest("Only schools already in the trash can be permanently deleted. Move it to the trash first.");
    }

    const schoolName = school.name;
    await prisma.school.delete({ where: { id: schoolId } }); // cascades — irreversible

    // The school row (and therefore any audit log tied to it via schoolId) is gone, so this
    // final entry is deliberately logged without a schoolId — it would otherwise be deleted
    // by the very cascade it's recording.
    await recordAudit({
      action: "SCHOOL_PURGED",
      actorId: developerId,
      detail: `${schoolName} permanently deleted by developer — this cannot be undone`,
    });

    return { message: `${schoolName} has been permanently deleted.` };
  },

  async listVerificationRequests() {
    return prisma.verificationRequest.findMany({
      where: { status: StaffApprovalStatus.PENDING },
      include: { school: { select: { id: true, name: true, email: true, registrantName: true, registrantDesignation: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
    });
  },

  async approveSchool(schoolId: string, developerId: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school || school.deletedAt) throw ApiError.notFound("School not found.");
    if (school.status !== SchoolStatus.PENDING_VERIFICATION) {
      throw ApiError.badRequest("This school is not awaiting approval.");
    }

    const code = generateNumericCode(6);
    const codeHash = await hashValue(code);
    const sharedPassword = generateSharedPassword();
    const sharedPasswordHash = await hashValue(sharedPassword);

    await prisma.$transaction([
      prisma.school.update({
        where: { id: schoolId },
        data: {
          status: SchoolStatus.CODE_SENT,
          verificationCode: codeHash,
          verificationExpires: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
          housemasterPasswordHash: sharedPasswordHash,
        },
      }),
      prisma.verificationRequest.update({
        where: { schoolId },
        data: { status: StaffApprovalStatus.APPROVED, reviewedBy: developerId, reviewedAt: new Date() },
      }),
    ]);

    await emailService.sendVerificationCode(school.email, code, sharedPassword);
    await recordAudit({ action: "SCHOOL_APPROVED", actorId: developerId, schoolId });

    return { message: `Verification code sent to ${school.email}.` };
  },

  async rejectSchool(schoolId: string, developerId: string, reason?: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school || school.deletedAt) throw ApiError.notFound("School not found.");

    await prisma.$transaction([
      prisma.school.update({ where: { id: schoolId }, data: { status: SchoolStatus.REJECTED } }),
      prisma.verificationRequest.update({
        where: { schoolId },
        data: { status: StaffApprovalStatus.REJECTED, reviewedBy: developerId, reviewedAt: new Date(), notes: reason },
      }),
    ]);

    await emailService.notifySchoolRejected(school.email, school.name, reason);
    await recordAudit({ action: "SCHOOL_REJECTED", actorId: developerId, schoolId, detail: reason });

    return { message: `${school.name} registration rejected.` };
  },

  async listAllTransactions(page = 1, pageSize = 30) {
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          school: { select: { name: true } },
          senderStudent: { select: { fullName: true, admissionNumber: true } },
          receiverStudent: { select: { fullName: true, admissionNumber: true } },
          createdBy: { select: { fullName: true, role: true } },
        },
      }),
      prisma.transaction.count(),
    ]);
    return { items, total, page, pageSize };
  },

  async listActiveUsers() {
    return prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, role: true, schoolId: true, createdAt: true, school: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  async listFailedLogins(page = 1, pageSize = 30) {
    const [items, total] = await Promise.all([
      prisma.failedLogin.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.failedLogin.count(),
    ]);
    return { items, total, page, pageSize };
  },

  async listAuditLogs(page = 1, pageSize = 30, filters?: { schoolId?: string; action?: AuditAction }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters?.schoolId ? { schoolId: filters.schoolId } : {}),
      ...(filters?.action ? { action: filters.action } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { fullName: true, role: true } }, school: { select: { name: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  async getSettings() {
    return prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
  },

  async updateSetting(key: string, value: string) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  },

  async getDatabaseOverview() {
    const [schools, users, students, transactions, auditLogs, refreshTokens] = await Promise.all([
      prisma.school.count(),
      prisma.user.count(),
      prisma.student.count(),
      prisma.transaction.count(),
      prisma.auditLog.count(),
      prisma.refreshToken.count({ where: { revoked: false, expiresAt: { gt: new Date() } } }),
    ]);
    return { schools, users, students, transactions, auditLogs, activeRefreshTokens: refreshTokens };
  },

  getStorageOverview() {
    const configured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);
    return {
      provider: "Cloudinary",
      configured,
      status: configured ? "connected" : "not configured — future-ready, no active uploads yet",
    };
  },

  async getApiHealth() {
    const startedAt = process.uptime();
    let dbHealthy = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbHealthy = false;
    }
    return {
      status: dbHealthy ? "healthy" : "degraded",
      uptimeSeconds: Math.floor(startedAt),
      database: dbHealthy ? "connected" : "unreachable",
      timestamp: new Date().toISOString(),
    };
  },
};
