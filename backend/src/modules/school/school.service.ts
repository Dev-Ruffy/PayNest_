import { Role, SchoolStatus } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";

/**
 * A school is usable (loginable, listable, joinable) only if it exists and hasn't
 * been soft-deleted. Deliberately a plain predicate — not a throwing helper — so
 * every call site keeps its own existing error message rather than a shared one
 * that could accidentally leak whether a school exists vs. is merely deleted.
 */
export function isSchoolUsable(school: { deletedAt: Date | null } | null | undefined): boolean {
  return !!school && !school.deletedAt;
}

export const schoolService = {
  /** Public directory of active schools, used by the "Join Existing School" flow. */
  async listActiveSchools() {
    return prisma.school.findMany({
      where: { status: SchoolStatus.ACTIVE, deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  },

  /** Lightweight status check so the registration page can poll for approval. */
  async getStatus(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, status: true, deletedAt: true },
    });
    if (!school || school.deletedAt) throw ApiError.notFound("School not found.");
    return school;
  },

  /**
   * Tells the sign-up flow whether an Accountant/Seller slot is taken, so
   * the UI can show "Login" instead of "Sign Up" — enforcing the one
   * Accountant / one Seller per school rule before the user even submits.
   */
  async getStaffAvailability(schoolId: string) {
    const [accountant, seller] = await Promise.all([
      prisma.user.findFirst({ where: { schoolId, role: Role.ACCOUNTANT } }),
      prisma.user.findFirst({ where: { schoolId, role: Role.SELLER } }),
    ]);
    return {
      accountantAvailable: !accountant,
      sellerAvailable: !seller,
    };
  },
};
