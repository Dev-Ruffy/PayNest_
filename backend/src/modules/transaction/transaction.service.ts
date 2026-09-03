import { Role, TransactionType } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { compareValue, hashValue } from "../../utils/bcrypt.util";
import { encryptSecret } from "../../utils/crypto.util";
import { recordAudit } from "../../utils/auditLog.util";

export const transactionService = {
  /**
   * Accountant or Housemaster credits a student's wallet after receiving cash.
   */
  async creditStudent(params: {
    schoolId: string;
    studentId: string;
    amount: number;
    description?: string;
    createdById: string;
    createdByRole: Role;
  }) {
    if (params.amount <= 0) throw ApiError.badRequest("Amount must be greater than zero.");

    const student = await prisma.student.findFirst({ where: { id: params.studentId, schoolId: params.schoolId } });
    if (!student || !student.isActive) throw ApiError.notFound("Student not found at this school.");

    const [, transaction] = await prisma.$transaction([
      prisma.student.update({
        where: { id: student.id },
        data: { walletBalance: { increment: params.amount } },
      }),
      prisma.transaction.create({
        data: {
          type: TransactionType.DEPOSIT,
          amount: params.amount,
          description: params.description ?? "Wallet top-up",
          schoolId: params.schoolId,
          receiverStudentId: student.id,
          createdById: params.createdById,
          createdByRole: params.createdByRole,
        },
      }),
    ]);

    await recordAudit({
      action: "WALLET_CREDITED",
      actorId: params.createdById,
      schoolId: params.schoolId,
      detail: `${student.fullName} (${student.admissionNumber}) credited ${params.amount}`,
    });

    const updated = await prisma.student.findUnique({ where: { id: student.id } });
    return { transaction, walletBalance: updated?.walletBalance };
  },

  /**
   * Tuck Shop Seller purchase: verifies the student's PIN, deducts from the
   * student wallet, and credits the seller's wallet in the same operation.
   *
   * Students no longer choose a PIN at account creation (their accounts are
   * created by an Accountant/Housemaster without one). Instead, the PIN typed
   * into a student's very first purchase becomes their permanent PIN — used
   * for every purchase and login from then on. `isFirstPurchase` in the
   * return value tells the caller which case just happened.
   */
  async purchase(params: {
    schoolId: string;
    studentId: string;
    sellerId: string;
    amount: number;
    items: string[];
    pin: string;
  }) {
    if (params.amount <= 0) throw ApiError.badRequest("Amount must be greater than zero.");

    const student = await prisma.student.findFirst({ where: { id: params.studentId, schoolId: params.schoolId } });
    if (!student || !student.isActive) throw ApiError.notFound("Student not found at this school.");

    const isFirstPurchase = !student.pinHash;

    if (isFirstPurchase) {
      // Nothing to verify yet — this purchase's PIN becomes the student's PIN going forward.
      const pinHash = await hashValue(params.pin);
      const pinEncrypted = encryptSecret(params.pin);
      await prisma.student.update({ where: { id: student.id }, data: { pinHash, pinEncrypted } });
    } else {
      const pinValid = await compareValue(params.pin, student.pinHash as string);
      if (!pinValid) throw ApiError.unauthorized("Incorrect student PIN.");
    }

    if (Number(student.walletBalance) < params.amount) {
      throw ApiError.badRequest("Insufficient wallet balance.");
    }

    const [, , transaction] = await prisma.$transaction([
      prisma.student.update({
        where: { id: student.id },
        data: { walletBalance: { decrement: params.amount } },
      }),
      prisma.user.update({
        where: { id: params.sellerId },
        data: { walletBalance: { increment: params.amount } },
      }),
      prisma.transaction.create({
        data: {
          type: TransactionType.PURCHASE,
          amount: params.amount,
          description: "Tuck shop purchase",
          schoolId: params.schoolId,
          senderStudentId: student.id,
          receiverUserId: params.sellerId,
          items: JSON.stringify(params.items),
          createdById: params.sellerId,
          createdByRole: Role.SELLER,
        },
      }),
    ]);

    await recordAudit({
      action: "WALLET_DEBITED",
      actorId: params.sellerId,
      schoolId: params.schoolId,
      detail: isFirstPurchase
        ? `${student.fullName} (${student.admissionNumber}) set their PIN and purchased items worth ${params.amount}`
        : `${student.fullName} (${student.admissionNumber}) purchased items worth ${params.amount}`,
    });

    const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });

    return {
      transaction,
      isFirstPurchase,
      receipt: {
        reference: transaction.reference,
        studentName: student.fullName,
        admissionNumber: student.admissionNumber,
        amount: params.amount,
        items: params.items,
        remainingBalance: updatedStudent?.walletBalance,
        timestamp: transaction.createdAt,
        isFirstPurchase,
      },
    };
  },

  async listForSchool(schoolId: string, page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          senderStudent: { select: { fullName: true, admissionNumber: true } },
          receiverStudent: { select: { fullName: true, admissionNumber: true } },
          createdBy: { select: { fullName: true, role: true } },
        },
      }),
      prisma.transaction.count({ where: { schoolId } }),
    ]);
    return { items, total, page, pageSize };
  },

  async listForStudent(studentId: string, page = 1, pageSize = 20) {
    const where = { OR: [{ senderStudentId: studentId }, { receiverStudentId: studentId }] };
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  async listCreatedBy(createdById: string, page = 1, pageSize = 20) {
    const where = { createdById };
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { receiverStudent: { select: { fullName: true, admissionNumber: true } } },
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  async listForSeller(sellerId: string, page = 1, pageSize = 20) {
    const where = { receiverUserId: sellerId };
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { senderStudent: { select: { fullName: true, admissionNumber: true } } },
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },
};
