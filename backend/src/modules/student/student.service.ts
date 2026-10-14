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
        house: true,
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

  async listForSchool(
    schoolId: string,
    search?: string,
    page = 1,
    pageSize = 20,
    filters?: { className?: string; house?: string }
  ) {
    const where = {
      schoolId,
      ...(filters?.className ? { className: filters.className } : {}),
      ...(filters?.house ? { house: filters.house } : {}),
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
          house: true,
          walletBalance: true,
          isActive: true,
          createdAt: true,
          pinHash: true,
        },
      }),
      prisma.student.count({ where }),
    ]);

    interface RawStudentRow {
      id: string;
      fullName: string;
      admissionNumber: string;
      className: string;
      house: string | null;
      walletBalance: unknown;
      isActive: boolean;
      createdAt: Date;
      pinHash: string | null;
    }
    const items = (rawItems as RawStudentRow[]).map(({ pinHash, ...rest }) => ({ ...rest, hasPin: !!pinHash }));

    return { items, total, page, pageSize };
  },

  async listGroupings(schoolId: string) {
    const [classes, houses] = await Promise.all([
      prisma.student.findMany({ where: { schoolId }, select: { className: true }, distinct: ["className"] }),
      prisma.student.findMany({ where: { schoolId, house: { not: null } }, select: { house: true }, distinct: ["house"] }),
    ]);
    return {
      classNames: classes.map((c: { className: string }) => c.className).sort(),
      houses: houses.map((h: { house: string | null }) => h.house as string).sort(),
    };
  },

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
