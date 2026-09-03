import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { decryptSecret } from "../../utils/crypto.util";
import { recordAudit } from "../../utils/auditLog.util";

export const studentService = {
  async getProfile(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        className: true,
        parentName: true,
        parentPhone: true,
        parentEmail: true,
        walletBalance: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
      },
    });
    if (!student) throw ApiError.notFound("Student profile not found.");
    return student;
  },

  /** Shared directory search used by Admin, Accountant and Housemaster dashboards. */
  async listForSchool(schoolId: string, search?: string, page = 1, pageSize = 20) {
    const where = {
      schoolId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { admissionNumber: { contains: search, mode: "insensitive" as const } },
              { className: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [rawItems, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: { fullName: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          admissionNumber: true,
          className: true,
          walletBalance: true,
          isActive: true,
          createdAt: true,
          pinHash: true, // used only to compute hasPin below — the hash itself is never returned
        },
      }),
      prisma.student.count({ where }),
    ]);

    // Never expose the raw hash to the client — only whether a PIN exists yet.
    interface RawStudentRow {
      id: string;
      fullName: string;
      admissionNumber: string;
      className: string;
      walletBalance: unknown;
      isActive: boolean;
      createdAt: Date;
      pinHash: string | null;
    }
    const items = (rawItems as RawStudentRow[]).map(({ pinHash, ...rest }) => ({ ...rest, hasPin: !!pinHash }));

    return { items, total, page, pageSize };
  },

  /**
   * Reveals a student's PIN for lost-PIN recovery. Shared by Admin and
   * Housemaster (both are trusted to help a student who's forgotten it) —
   * kept in one place so the "PIN not set yet" case can't be forgotten by
   * either caller. Every successful reveal is audit-logged.
   */
  async viewPin(schoolId: string, studentId: string, actorId: string) {
    const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
    if (!student) throw ApiError.notFound("Student not found.");

    if (!student.pinEncrypted) {
      return { studentId: student.id, admissionNumber: student.admissionNumber, pin: null, hasPin: false };
    }

    const pin = decryptSecret(student.pinEncrypted);

    await recordAudit({
      action: "PIN_VIEWED",
      actorId,
      schoolId,
      detail: `PIN viewed for ${student.fullName} (${student.admissionNumber})`,
    });

    return { studentId: student.id, admissionNumber: student.admissionNumber, pin, hasPin: true };
  },
};
