import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { recordAudit } from "../../utils/auditLog.util";

export const productService = {
  async listAllForSchool(schoolId: string) {
    return prisma.product.findMany({ where: { schoolId }, orderBy: { name: "asc" } });
  },

  async listActiveForSchool(schoolId: string) {
    return prisma.product.findMany({ where: { schoolId, isActive: true }, orderBy: { name: "asc" } });
  },

  async create(params: { schoolId: string; name: string; price: number; createdById: string }) {
    const product = await prisma.product.create({
      data: { name: params.name, price: params.price, schoolId: params.schoolId, createdById: params.createdById },
    });
    await recordAudit({
      action: "PRODUCT_CREATED",
      actorId: params.createdById,
      schoolId: params.schoolId,
      detail: `${params.name} added at ${params.price}`,
    });
    return product;
  },

  async update(params: {
    schoolId: string;
    productId: string;
    actorId: string;
    name?: string;
    price?: number;
    isActive?: boolean;
  }) {
    const existing = await prisma.product.findFirst({ where: { id: params.productId, schoolId: params.schoolId } });
    if (!existing) throw ApiError.notFound("Product not found.");

    const product = await prisma.product.update({
      where: { id: params.productId },
      data: {
        ...(params.name !== undefined ? { name: params.name } : {}),
        ...(params.price !== undefined ? { price: params.price } : {}),
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      },
    });

    await recordAudit({
      action: params.isActive === false ? "PRODUCT_DEACTIVATED" : "PRODUCT_UPDATED",
      actorId: params.actorId,
      schoolId: params.schoolId,
      detail: `${product.name} updated`,
    });
    return product;
  },
};
