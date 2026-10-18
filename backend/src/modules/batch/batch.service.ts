import { BatchOrderStatus, BatchStatus, Role } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { recordAudit } from "../../utils/auditLog.util";
import { transactionService } from "../transaction/transaction.service";

const ORDER_INCLUDE = {
  student: { select: { id: true, fullName: true, admissionNumber: true, className: true, house: true, walletBalance: true } },
  items: true,
} as const;

async function getDraftBatchOrThrow(schoolId: string, batchId: string) {
  const batch = await prisma.batch.findFirst({ where: { id: batchId, schoolId } });
  if (!batch) throw ApiError.notFound("Batch not found.");
  if (batch.status !== BatchStatus.DRAFT) {
    throw ApiError.badRequest("This batch is no longer a draft and can't be edited.");
  }
  return batch;
}

function recomputeOrderTotal(items: { lineTotal: unknown }[]): number {
  return items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
}

interface ProductRow {
  id: string;
  name: string;
  price: unknown;
}

export const batchService = {
  async createBatch(params: { schoolId: string; createdById: string; label?: string }) {
    const batch = await prisma.batch.create({
      data: { schoolId: params.schoolId, createdById: params.createdById, label: params.label },
    });
    await recordAudit({
      action: "BATCH_CREATED",
      actorId: params.createdById,
      schoolId: params.schoolId,
      detail: `Batch ${batch.id.slice(0, 8)} started${params.label ? ` - ${params.label}` : ""}`,
    });
    return batch;
  },

  async listForHousemaster(schoolId: string, createdById: string, page = 1, pageSize = 20) {
    const where = { schoolId, createdById };
    const [items, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { orders: true } } },
      }),
      prisma.batch.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  async listForSchool(schoolId: string, page = 1, pageSize = 20) {
    const where = { schoolId, status: { in: [BatchStatus.COMPLETED, BatchStatus.PROCESSING] } };
    const [items, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { createdBy: { select: { fullName: true } }, _count: { select: { orders: true } } },
      }),
      prisma.batch.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  async getBatchDetail(schoolId: string, batchId: string) {
    const batch = await prisma.batch.findFirst({
      where: { id: batchId, schoolId },
      include: {
        orders: { include: ORDER_INCLUDE, orderBy: { createdAt: "asc" } },
        createdBy: { select: { fullName: true } },
      },
    });
    if (!batch) throw ApiError.notFound("Batch not found.");

    const liveTotal = batch.orders.reduce((sum: number, o: { totalAmount: unknown }) => sum + Number(o.totalAmount), 0);
    return { ...batch, liveTotal, liveStudentCount: batch.orders.length };
  },

  async addStudents(params: { schoolId: string; batchId: string; studentIds: string[] }) {
    const batch = await getDraftBatchOrThrow(params.schoolId, params.batchId);

    const students = await prisma.student.findMany({
      where: { id: { in: params.studentIds }, schoolId: params.schoolId, isActive: true },
      select: { id: true },
    });
    if (students.length === 0) throw ApiError.badRequest("No valid students found to add.");

    const existing = await prisma.batchOrder.findMany({
      where: { batchId: batch.id, studentId: { in: students.map((s: { id: string }) => s.id) } },
      select: { studentId: true },
    });
    const existingIds = new Set(existing.map((e: { studentId: string }) => e.studentId));
    const toAdd = students.filter((s: { id: string }) => !existingIds.has(s.id));

    if (toAdd.length > 0) {
      await prisma.batchOrder.createMany({
        data: toAdd.map((s: { id: string }) => ({ batchId: batch.id, studentId: s.id, totalAmount: 0 })),
      });
    }

    return { added: toAdd.length, alreadyPresent: existing.length };
  },

  async removeStudent(params: { schoolId: string; batchId: string; studentId: string }) {
    await getDraftBatchOrThrow(params.schoolId, params.batchId);
    await prisma.batchOrder.deleteMany({ where: { batchId: params.batchId, studentId: params.studentId } });
    return { message: "Student removed from the batch." };
  },

  async setStudentOrder(params: {
    schoolId: string;
    batchId: string;
    studentId: string;
    items?: { productId: string; quantity: number }[];
    isCustom?: boolean;
    customAmount?: number;
    customReason?: string;
  }) {
    await getDraftBatchOrThrow(params.schoolId, params.batchId);

    const batchOrder = await prisma.batchOrder.findUnique({
      where: { batchId_studentId: { batchId: params.batchId, studentId: params.studentId } },
    });
    if (!batchOrder) throw ApiError.notFound("This student isn't in the batch yet.");

    if (params.isCustom) {
      if (!params.customAmount || params.customAmount <= 0) throw ApiError.badRequest("Enter a custom amount greater than zero.");
      if (!params.customReason) throw ApiError.badRequest("A reason is required for a custom amount.");

      await prisma.$transaction([
        prisma.batchOrderItem.deleteMany({ where: { batchOrderId: batchOrder.id } }),
        prisma.batchOrderItem.create({
          data: {
            batchOrderId: batchOrder.id,
            productId: null,
            nameSnapshot: "Custom order",
            priceSnapshot: params.customAmount,
            quantity: 1,
            lineTotal: params.customAmount,
          },
        }),
        prisma.batchOrder.update({
          where: { id: batchOrder.id },
          data: { totalAmount: params.customAmount, isCustom: true, customReason: params.customReason },
        }),
      ]);

      return prisma.batchOrder.findUnique({ where: { id: batchOrder.id }, include: ORDER_INCLUDE });
    }

    const items = params.items ?? [];
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, schoolId: params.schoolId } });
    const productMap = new Map<string, ProductRow>((products as ProductRow[]).map((p) => [p.id, p]));

    const lines = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw ApiError.badRequest("One of the selected products no longer exists.");
      return {
        batchOrderId: batchOrder.id,
        productId: product.id,
        nameSnapshot: product.name,
        priceSnapshot: product.price as number,
        quantity: item.quantity,
        lineTotal: Number(product.price) * item.quantity,
      };
    });

    const total = recomputeOrderTotal(lines);

    await prisma.$transaction([
      prisma.batchOrderItem.deleteMany({ where: { batchOrderId: batchOrder.id } }),
      ...lines.map((line) => prisma.batchOrderItem.create({ data: line })),
      prisma.batchOrder.update({
        where: { id: batchOrder.id },
        data: { totalAmount: total, isCustom: false, customReason: null },
      }),
    ]);

    return prisma.batchOrder.findUnique({ where: { id: batchOrder.id }, include: ORDER_INCLUDE });
  },

  /** "Apply to Selected Students": adds or increases one or more products across many students at once, adding them to the batch first if needed. */
  async applyProductsToStudents(params: {
    schoolId: string;
    batchId: string;
    studentIds: string[];
    items: { productId: string; quantity: number }[];
  }) {
    const batch = await getDraftBatchOrThrow(params.schoolId, params.batchId);

    // If the same product is listed twice, merge it into one line with the quantities added together.
    const wanted = new Map<string, number>();
    for (const item of params.items) {
      wanted.set(item.productId, (wanted.get(item.productId) ?? 0) + item.quantity);
    }

    const products = (await prisma.product.findMany({
      where: { id: { in: Array.from(wanted.keys()) }, schoolId: params.schoolId, isActive: true },
    })) as ProductRow[];
    if (products.length !== wanted.size) {
      throw ApiError.badRequest("One of the selected products was not found or is no longer active.");
    }

    const students = await prisma.student.findMany({
      where: { id: { in: params.studentIds }, schoolId: params.schoolId, isActive: true },
      select: { id: true },
    });
    if (students.length === 0) throw ApiError.badRequest("No valid students found.");

    let appliedCount = 0;

    for (const student of students) {
      // eslint-disable-next-line no-await-in-loop
      const batchOrder = await prisma.batchOrder.upsert({
        where: { batchId_studentId: { batchId: batch.id, studentId: student.id } },
        update: {},
        create: { batchId: batch.id, studentId: student.id, totalAmount: 0 },
        include: { items: true },
      });

      for (const product of products) {
        const quantity = wanted.get(product.id) as number;
        const existingLine = batchOrder.items.find((i: { productId: string | null }) => i.productId === product.id);

        if (existingLine) {
          const newQty = existingLine.quantity + quantity;
          // eslint-disable-next-line no-await-in-loop
          await prisma.batchOrderItem.update({
            where: { id: existingLine.id },
            data: { quantity: newQty, lineTotal: Number(product.price) * newQty, priceSnapshot: product.price as number },
          });
        } else {
          // eslint-disable-next-line no-await-in-loop
          await prisma.batchOrderItem.create({
            data: {
              batchOrderId: batchOrder.id,
              productId: product.id,
              nameSnapshot: product.name,
              priceSnapshot: product.price as number,
              quantity,
              lineTotal: Number(product.price) * quantity,
            },
          });
        }
      }

      // eslint-disable-next-line no-await-in-loop
      const freshItems = await prisma.batchOrderItem.findMany({ where: { batchOrderId: batchOrder.id } });
      // eslint-disable-next-line no-await-in-loop
      await prisma.batchOrder.update({
        where: { id: batchOrder.id },
        data: { totalAmount: recomputeOrderTotal(freshItems), isCustom: false, customReason: null },
      });

      appliedCount += 1;
    }

    return { appliedCount, productCount: products.length };
  },

  async getReview(schoolId: string, batchId: string) {
    const batch = await prisma.batch.findFirst({
      where: { id: batchId, schoolId },
      include: { orders: { include: ORDER_INCLUDE, orderBy: { createdAt: "asc" } } },
    });
    if (!batch) throw ApiError.notFound("Batch not found.");

    let readyCount = 0;
    let insufficientCount = 0;
    let grandTotal = 0;

    interface ReviewOrderRow {
      id: string;
      student: { walletBalance: unknown; [key: string]: unknown };
      totalAmount: unknown;
      isCustom: boolean;
      customReason: string | null;
      items: unknown;
    }

    const orders = (batch.orders as ReviewOrderRow[]).map((order) => {
      const balance = Number(order.student.walletBalance);
      const total = Number(order.totalAmount);
      const ready = total > 0 && balance >= total;
      if (total > 0) {
        if (ready) readyCount += 1;
        else insufficientCount += 1;
      }
      grandTotal += total;
      return {
        batchOrderId: order.id,
        student: order.student,
        items: order.items,
        totalAmount: total,
        isCustom: order.isCustom,
        customReason: order.customReason,
        liveStatus: total === 0 ? "EMPTY" : ready ? "READY" : "INSUFFICIENT_BALANCE",
        shortfall: ready ? 0 : Math.max(0, total - balance),
      };
    });

    return {
      batchId: batch.id,
      label: batch.label,
      status: batch.status,
      studentCount: orders.length,
      readyCount,
      insufficientCount,
      grandTotal,
      orders,
    };
  },

  async confirmBatch(params: { schoolId: string; batchId: string; actorId: string }) {
    const batch = await prisma.batch.findFirst({ where: { id: params.batchId, schoolId: params.schoolId } });
    if (!batch) throw ApiError.notFound("Batch not found.");

    // Atomic claim - the single guard against double-submission.
    const claimed = await prisma.batch.updateMany({
      where: { id: batch.id, status: BatchStatus.DRAFT },
      data: { status: BatchStatus.PROCESSING },
    });
    if (claimed.count !== 1) {
      throw ApiError.conflict("This batch has already been processed or is currently being processed.");
    }

    const seller = await prisma.user.findFirst({ where: { schoolId: params.schoolId, role: Role.SELLER } });
    if (!seller) {
      await prisma.batch.update({ where: { id: batch.id }, data: { status: BatchStatus.DRAFT } });
      throw ApiError.badRequest("This school doesn't have a Tuck Shop Seller yet - add one before confirming a batch.");
    }

    const orders = await prisma.batchOrder.findMany({
      where: { batchId: batch.id },
      include: { student: true, items: true },
    });

    let successCount = 0;
    let insufficientCount = 0;
    let failedCount = 0;
    let totalDeducted = 0;

    for (const order of orders) {
      const total = Number(order.totalAmount);

      if (total <= 0) {
        // eslint-disable-next-line no-await-in-loop
        await prisma.batchOrder.update({
          where: { id: order.id },
          data: { status: BatchOrderStatus.FAILED, failureReason: "No items were added for this student." },
        });
        failedCount += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      const currentBalance = Number(order.student.walletBalance);

      if (currentBalance < total) {
        // eslint-disable-next-line no-await-in-loop
        await prisma.batchOrder.update({
          where: { id: order.id },
          data: {
            status: BatchOrderStatus.INSUFFICIENT_BALANCE,
            failureReason: `Required ${total.toFixed(2)}, available ${currentBalance.toFixed(2)}, shortfall ${(total - currentBalance).toFixed(2)}.`,
          },
        });
        insufficientCount += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      try {
        const itemNames = order.items.map((i: { nameSnapshot: string; quantity: number }) => `${i.nameSnapshot} x${i.quantity}`);
        // eslint-disable-next-line no-await-in-loop
        const transaction = await transactionService.settlePurchase({
          schoolId: params.schoolId,
          studentId: order.studentId,
          currentBalance,
          sellerId: seller.id,
          amount: total,
          items: itemNames,
          createdById: params.actorId,
          createdByRole: Role.HOUSEMASTER,
          description: batch.label ? `Bulk order: ${batch.label}` : "Bulk order",
        });

        // eslint-disable-next-line no-await-in-loop
        await prisma.batchOrder.update({
          where: { id: order.id },
          data: { status: BatchOrderStatus.COMPLETED, transactionId: transaction.id },
        });
        successCount += 1;
        totalDeducted += total;
      } catch (err) {
        // eslint-disable-next-line no-await-in-loop
        await prisma.batchOrder.update({
          where: { id: order.id },
          data: { status: BatchOrderStatus.FAILED, failureReason: (err as Error).message },
        });
        failedCount += 1;
      }
    }

    await prisma.batch.update({
      where: { id: batch.id },
      data: { status: BatchStatus.COMPLETED, confirmedAt: new Date(), totalAmount: totalDeducted, studentCount: orders.length },
    });

    const customCount = orders.filter((o: { isCustom: boolean }) => o.isCustom).length;

    await recordAudit({
      action: "BATCH_CONFIRMED",
      actorId: params.actorId,
      schoolId: params.schoolId,
      detail: `Batch ${batch.id.slice(0, 8)}: ${successCount} successful, ${insufficientCount} insufficient balance, ${failedCount} failed, ${customCount} custom-amount order(s). Total deducted ${totalDeducted.toFixed(2)}.`,
    });

    return {
      batchId: batch.id,
      studentCount: orders.length,
      successCount,
      insufficientCount,
      failedCount,
      totalDeducted,
      totalCredited: totalDeducted,
    };
  },

  async duplicateBatch(params: { schoolId: string; batchId: string; createdById: string }) {
    const source = await prisma.batch.findFirst({
      where: { id: params.batchId, schoolId: params.schoolId },
      include: { orders: { include: { items: true } } },
    });
    if (!source) throw ApiError.notFound("Batch not found.");

    const newBatch = await prisma.batch.create({
      data: {
        schoolId: params.schoolId,
        createdById: params.createdById,
        label: source.label ? `${source.label} (copy)` : undefined,
        duplicatedFromId: source.id,
      },
    });

    interface ItemRow {
      productId: string | null;
      nameSnapshot: string;
      priceSnapshot: unknown;
      quantity: number;
    }

    for (const order of source.orders) {
      // eslint-disable-next-line no-await-in-loop
      const newOrder = await prisma.batchOrder.create({
        data: { batchId: newBatch.id, studentId: order.studentId, totalAmount: 0 },
      });

      if (order.isCustom) {
        const amount = Number(order.totalAmount);
        // eslint-disable-next-line no-await-in-loop
        await prisma.batchOrderItem.create({
          data: { batchOrderId: newOrder.id, productId: null, nameSnapshot: "Custom order", priceSnapshot: amount, quantity: 1, lineTotal: amount },
        });
        // eslint-disable-next-line no-await-in-loop
        await prisma.batchOrder.update({
          where: { id: newOrder.id },
          data: { totalAmount: amount, isCustom: true, customReason: order.customReason },
        });
        // eslint-disable-next-line no-continue
        continue;
      }

      const orderItems = order.items as ItemRow[];
      const productIds = orderItems.filter((i) => i.productId).map((i) => i.productId as string);
      // eslint-disable-next-line no-await-in-loop
      const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map<string, ProductRow>((products as ProductRow[]).map((p) => [p.id, p]));

      let total = 0;
      for (const item of orderItems) {
        const product = item.productId ? productMap.get(item.productId) : undefined;
        const price = product ? Number(product.price) : Number(item.priceSnapshot);
        const lineTotal = price * item.quantity;
        total += lineTotal;
        // eslint-disable-next-line no-await-in-loop
        await prisma.batchOrderItem.create({
          data: {
            batchOrderId: newOrder.id,
            productId: product?.id,
            nameSnapshot: product?.name ?? item.nameSnapshot,
            priceSnapshot: price,
            quantity: item.quantity,
            lineTotal,
          },
        });
      }

      // eslint-disable-next-line no-await-in-loop
      await prisma.batchOrder.update({ where: { id: newOrder.id }, data: { totalAmount: total } });
    }

    return newBatch;
  },

  async cancelBatch(params: { schoolId: string; batchId: string; actorId: string }) {
    await getDraftBatchOrThrow(params.schoolId, params.batchId);
    await prisma.batch.update({ where: { id: params.batchId }, data: { status: BatchStatus.CANCELLED } });
    await recordAudit({
      action: "BATCH_CANCELLED",
      actorId: params.actorId,
      schoolId: params.schoolId,
      detail: `Batch ${params.batchId.slice(0, 8)} discarded before processing`,
    });
    return { message: "Batch cancelled." };
  },
};
