import { Role, TransactionType } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { compareValue, hashValue } from "../../utils/bcrypt.util";
import { encryptSecret } from "../../utils/crypto.util";
import { recordAudit } from "../../utils/auditLog.util";

// Every transaction list returns the same details, so history screens can show
// the student's name, what was bought and who recorded it, whichever role is looking.
const TX_INCLUDE = {
  senderStudent: { select: { fullName: true, admissionNumber: true } },
  receiverStudent: { select: { fullName: true, admissionNumber: true } },
  createdBy: { select: { fullName: true, role: true } },
} as const;

async function assertWithinCreditLimit(schoolId: string, studentId: string, amount: number) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { creditPeriodMaxAmount: true, currentPeriodStartedAt: true },
  });
  if (!school?.creditPeriodMaxAmount || !school.currentPeriodStartedAt) return;

  const sum = await prisma.transaction.aggregate({
    where: { receiverStudentId: studentId, type: TransactionType.DEPOSIT, createdAt: { gte: school.currentPeriodStartedAt } },
    _sum: { amount: true },
  });

  const alreadyCredited = Number(sum._sum.amount ?? 0);
  const max = Number(school.creditPeriodMaxAmount);
  if (alreadyCredited + amount > max) {
    const remaining = Math.max(0, max - alreadyCredited);
    throw ApiError.badRequest(
      `This would exceed the student's credit limit for the current period. Limit: ${max.toFixed(2)}, already credited: ${alreadyCredited.toFixed(2)}, room remaining: ${remaining.toFixed(2)}.`
    );
  }
}

async function assertWithinDailySpendLimit(schoolId: string, studentId: string, amount: number) {
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { dailySpendMaxAmount: true } });
  if (!school?.dailySpendMaxAmount) return;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const sum = await prisma.transaction.aggregate({
    where: { senderStudentId: studentId, type: TransactionType.PURCHASE, createdAt: { gte: startOfDay } },
    _sum: { amount: true },
  });

  const spentToday = Number(sum._sum.amount ?? 0);
  const max = Number(school.dailySpendMaxAmount);
  if (spentToday + amount > max) {
    const remaining = Math.max(0, max - spentToday);
    throw ApiError.badRequest(
      `This would exceed the student's daily spending limit. Limit: ${max.toFixed(2)}, already spent today: ${spentToday.toFixed(2)}, room remaining: ${remaining.toFixed(2)}.`
    );
  }
}

async function settlePurchase(params: {
  schoolId: string;
  studentId: string;
  currentBalance: number;
  sellerId: string;
  amount: number;
  items: string[];
  createdById: string;
  createdByRole: Role;
  description?: string;
}) {
  if (params.amount <= 0) throw ApiError.badRequest("Amount must be greater than zero.");
  if (params.currentBalance < params.amount) throw ApiError.badRequest("Insufficient wallet balance.");

  await assertWithinDailySpendLimit(params.schoolId, params.studentId, params.amount);

  const [, , transaction] = await prisma.$transaction([
    prisma.student.update({ where: { id: params.studentId }, data: { walletBalance: { decrement: params.amount } } }),
    prisma.user.update({ where: { id: params.sellerId }, data: { walletBalance: { increment: params.amount } } }),
    prisma.transaction.create({
      data: {
        type: TransactionType.PURCHASE,
        amount: params.amount,
        description: params.description ?? "Tuck shop purchase",
        schoolId: params.schoolId,
        senderStudentId: params.studentId,
        receiverUserId: params.sellerId,
        items: JSON.stringify(params.items),
        createdById: params.createdById,
        createdByRole: params.createdByRole,
      },
    }),
  ]);

  return transaction;
}

export const transactionService = {
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

    await assertWithinCreditLimit(params.schoolId, params.studentId, params.amount);

    const [, transaction] = await prisma.$transaction([
      prisma.student.update({ where: { id: student.id }, data: { walletBalance: { increment: params.amount } } }),
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

  async purchase(params: {
    schoolId: string;
    studentId: string;
    sellerId: string;
    amount: number;
    items: string[];
    pin: string;
  }) {
    const student = await prisma.student.findFirst({ where: { id: params.studentId, schoolId: params.schoolId } });
    if (!student || !student.isActive) throw ApiError.notFound("Student not found at this school.");

    const isFirstPurchase = !student.pinHash;

    if (isFirstPurchase) {
      const pinHash = await hashValue(params.pin);
      const pinEncrypted = encryptSecret(params.pin);
      await prisma.student.update({ where: { id: student.id }, data: { pinHash, pinEncrypted } });
    } else {
      const pinValid = await compareValue(params.pin, student.pinHash as string);
      if (!pinValid) throw ApiError.unauthorized("Incorrect student PIN.");
    }

    const transaction = await settlePurchase({
      schoolId: params.schoolId,
      studentId: student.id,
      currentBalance: Number(student.walletBalance),
      sellerId: params.sellerId,
      amount: params.amount,
      items: params.items,
      createdById: params.sellerId,
      createdByRole: Role.SELLER,
    });

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

  settlePurchase,

  async listForSchool(schoolId: string, page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: TX_INCLUDE,
      }),
      prisma.transaction.count({ where: { schoolId } }),
    ]);
    return { items, total, page, pageSize };
  },

  async listForStudent(studentId: string, page = 1, pageSize = 20) {
    const where = { OR: [{ senderStudentId: studentId }, { receiverStudentId: studentId }] };
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: TX_INCLUDE }),
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
        include: TX_INCLUDE,
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
        include: TX_INCLUDE,
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  async getSellerBalanceSummary(sellerId: string) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const [seller, todaySum] = await Promise.all([
      prisma.user.findUnique({ where: { id: sellerId }, select: { walletBalance: true } }),
      prisma.transaction.aggregate({
        where: { receiverUserId: sellerId, type: TransactionType.PURCHASE, createdAt: { gte: startOfDay } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalBalance: seller?.walletBalance ?? 0,
      dailyProfit: todaySum._sum.amount ?? 0,
      dailySaleCount: todaySum._count,
    };
  },

  async getSellerDailyBalanceHistory(sellerId: string, days = 30) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    since.setUTCHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: { receiverUserId: sellerId, type: TransactionType.PURCHASE, createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const byDay = new Map<string, { total: number; count: number }>();
    for (const t of transactions) {
      const day = t.createdAt.toISOString().slice(0, 10);
      const existing = byDay.get(day) ?? { total: 0, count: 0 };
      existing.total += Number(t.amount);
      existing.count += 1;
      byDay.set(day, existing);
    }

    return Array.from(byDay.entries())
      .map(([date, stats]) => ({ date, total: stats.total, count: stats.count }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  },
};
