import { Response } from "express";
import { Role, SchoolStatus, StaffApprovalStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { hashValue, compareValue } from "../../utils/bcrypt.util";
import { generateToken, generateNumericCode } from "../../utils/generateCode.util";
import { signAccessToken } from "../../utils/jwt.util";
import { emailService } from "../../utils/email.util";
import { recordAudit } from "../../utils/auditLog.util";
import { encryptSecret } from "../../utils/crypto.util";
import { isSchoolUsable } from "../school/school.service";

const REFRESH_COOKIE_NAME = "paynest_refresh";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function refreshCookieOptions() {
  return {
    httpOnly: true,
    // SameSite=None is required for the cookie to be sent across different
    // sites (e.g. a Vercel frontend calling a Render backend) - and browsers
    // require Secure=true whenever SameSite=None is used, so both flip
    // together based on environment rather than independently.
    secure: env.isProd ? true : env.COOKIE_SECURE,
    sameSite: (env.isProd ? "none" : "lax") as "none" | "lax",
    // No `domain` attribute: a server can only set cookies for its own
    // origin. When the frontend and backend are on different domains, the
    // cookie should simply scope to whichever domain issued it.
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: "/api/auth",
  };
}

/** Issues an access token + rotating refresh token, and sets the refresh cookie. */
async function issueSession(
  res: Response,
  subject: { id: string; role: Role; schoolId: string | null; isStudent: boolean }
) {
  const accessToken = signAccessToken({ sub: subject.id, role: subject.role, schoolId: subject.schoolId });
  const rawRefresh = generateToken();

  await prisma.refreshToken.create({
    data: {
      token: await hashValue(rawRefresh),
      userId: subject.isStudent ? undefined : subject.id,
      studentId: subject.isStudent ? subject.id : undefined,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  res.cookie(REFRESH_COOKIE_NAME, `${subject.id}.${subject.role}.${rawRefresh}`, refreshCookieOptions());
  return accessToken;
}

/**
 * Finds the account a password reset applies to. Accountants and Sellers keep
 * their email on their own user record. The School Admin doesn't - their
 * email is the school's registration email - so that address maps to the
 * school's Admin account. Matching ignores letter case.
 */
async function findResettableUser(schoolId: string, email: string) {
  const typed = email.trim();

  const staff = await prisma.user.findFirst({
    where: { schoolId, role: { in: [Role.ACCOUNTANT, Role.SELLER] }, email: { equals: typed, mode: "insensitive" } },
  });
  if (staff) return staff;

  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { email: true, deletedAt: true } });
  if (school && !school.deletedAt && school.email.toLowerCase() === typed.toLowerCase()) {
    return prisma.user.findFirst({ where: { schoolId, role: Role.ADMIN } });
  }

  return null;
}

export const authService = {
  REFRESH_COOKIE_NAME,

  async registerSchool(input: {
    registrantName: string;
    registrantDesignation: string;
    schoolName: string;
    schoolEmail: string;
    username: string;
    password: string;
    creditPeriodType?: "TERM" | "SESSION";
    creditPeriodMaxAmount?: number;
    dailySpendMaxAmount?: number;
  }) {
    const existing = await prisma.school.findUnique({ where: { email: input.schoolEmail } });
    if (existing) throw ApiError.conflict("A school with this email is already registered.");

    const existingUsername = await prisma.user.findUnique({ where: { username: input.username } });
    if (existingUsername) throw ApiError.conflict("This username is already taken.");

    const passwordHash = await hashValue(input.password);

    const school = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdSchool = await tx.school.create({
        data: {
          name: input.schoolName,
          email: input.schoolEmail,
          registrantName: input.registrantName,
          registrantDesignation: input.registrantDesignation,
          registrantUsername: input.username,
          status: SchoolStatus.PENDING_VERIFICATION,
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
          schoolId: createdSchool.id,
          isActive: false, // activated once the school completes verification
        },
      });

      await tx.verificationRequest.create({
        data: { schoolId: createdSchool.id, status: StaffApprovalStatus.PENDING },
      });

      return createdSchool;
    });

    await emailService.notifyDeveloperOfNewSchool({
      registrantName: input.registrantName,
      schoolName: input.schoolName,
      schoolEmail: input.schoolEmail,
    });

    await recordAudit({ action: "SCHOOL_REGISTERED", schoolId: school.id, detail: `${school.name} registered by ${input.registrantName}` });

    return {
      schoolId: school.id,
      message:
        "A verification code will be sent to your school email after approval by the PayNest developer. This may take up to 5 minutes.",
    };
  },

  async verifySchool(schoolId: string, code: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw ApiError.notFound("School not found.");
    if (school.deletedAt) throw ApiError.notFound("School not found.");
    if (school.status !== SchoolStatus.CODE_SENT) {
      throw ApiError.badRequest("This school is not currently awaiting verification.");
    }
    if (!school.verificationCode || !school.verificationExpires) {
      throw ApiError.badRequest("No verification code has been issued yet.");
    }
    if (school.verificationExpires < new Date()) {
      throw ApiError.badRequest("This verification code has expired. Please contact the PayNest developer.");
    }

    const isValid = await compareValue(code, school.verificationCode);
    if (!isValid) throw ApiError.badRequest("Incorrect verification code.");

    await prisma.$transaction([
      prisma.school.update({
        where: { id: school.id },
        data: { status: SchoolStatus.ACTIVE, verificationCode: null, verificationExpires: null },
      }),
      prisma.user.updateMany({
        where: { schoolId: school.id, role: Role.ADMIN },
        data: { isActive: true },
      }),
    ]);

    await recordAudit({ action: "SCHOOL_VERIFIED", schoolId: school.id });

    return { message: "School verified successfully. You may now log in." };
  },

  async developerLogin(email: string, passcode: string, ip?: string) {
    if (email.toLowerCase() !== env.DEVELOPER_EMAIL.toLowerCase() || passcode !== env.DEVELOPER_PASSCODE) {
      await recordAudit({ action: "LOGIN_FAILED", detail: `Developer login failed for ${email}`, ipAddress: ip });
      throw ApiError.unauthorized("Invalid developer credentials.");
    }

    const developer = await prisma.user.upsert({
      where: { email: env.DEVELOPER_EMAIL },
      update: {},
      create: {
        role: Role.DEVELOPER,
        fullName: "PayNest Developer",
        email: env.DEVELOPER_EMAIL,
        isActive: true,
      },
    });

    await recordAudit({ action: "LOGIN_SUCCESS", actorId: developer.id, detail: "Developer login", ipAddress: ip });

    return { userId: developer.id };
  },

  async staffLogin(schoolId: string, username: string, password: string, role: Role, ip?: string) {
    const user = await prisma.user.findFirst({
      where: { schoolId, username, role: { in: [Role.ADMIN, Role.ACCOUNTANT, Role.SELLER] } },
      include: { school: true },
    });

    if (!user || !user.passwordHash || !isSchoolUsable(user.school)) {
      await recordAudit({ action: "LOGIN_FAILED", schoolId, detail: `Unknown username: ${username}`, ipAddress: ip });
      throw ApiError.unauthorized("Invalid username or password.");
    }

    const valid = await compareValue(password, user.passwordHash);
    if (!valid) {
      await recordAudit({ action: "LOGIN_FAILED", actorId: user.id, schoolId, ipAddress: ip });
      throw ApiError.unauthorized("Invalid username or password.");
    }

    // Right credentials, wrong door: each role may only sign in through its own login page.
    if (user.role !== role) {
      await recordAudit({
        action: "LOGIN_FAILED",
        actorId: user.id,
        schoolId,
        detail: `Used the ${role} login page with a ${user.role} account`,
        ipAddress: ip,
      });
      throw ApiError.forbidden("These details belong to a different type of account. Please use the login page for your own role.");
    }

    if (!user.isActive) throw ApiError.forbidden("Your school has not completed verification yet.");
    if (user.approvalStatus === StaffApprovalStatus.PENDING) {
      throw ApiError.forbidden("Your registration is still awaiting approval from your School Admin.");
    }
    if (user.approvalStatus === StaffApprovalStatus.REJECTED) {
      throw ApiError.forbidden("Your registration was declined by your School Admin.");
    }

    await recordAudit({ action: "LOGIN_SUCCESS", actorId: user.id, schoolId, ipAddress: ip });

    return user;
  },

  async housemasterLogin(schoolId: string, fullName: string, sharedPassword: string, ip?: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school || school.status !== SchoolStatus.ACTIVE || school.deletedAt || !school.housemasterPasswordHash) {
      throw ApiError.unauthorized("Invalid school or shared password.");
    }

    const valid = await compareValue(sharedPassword, school.housemasterPasswordHash);
    if (!valid) {
      await recordAudit({ action: "LOGIN_FAILED", schoolId, detail: `Housemaster login failed for ${fullName}`, ipAddress: ip });
      throw ApiError.unauthorized("Invalid school or shared password.");
    }

    // Housemasters share one password but are individually attributable by name.
    const housemaster = await prisma.user.upsert({
      where: { username: `hm:${schoolId}:${fullName.trim().toLowerCase()}` },
      update: {},
      create: {
        role: Role.HOUSEMASTER,
        fullName: fullName.trim(),
        username: `hm:${schoolId}:${fullName.trim().toLowerCase()}`,
        schoolId,
        isActive: true,
      },
    });

    await recordAudit({ action: "LOGIN_SUCCESS", actorId: housemaster.id, schoolId, ipAddress: ip });

    return housemaster;
  },

  async studentLogin(schoolId: string, admissionNumber: string, pin: string, ip?: string) {
    const student = await prisma.student.findUnique({
      where: { schoolId_admissionNumber: { schoolId, admissionNumber } },
      include: { school: true },
    });

    if (!student || !student.isActive || !isSchoolUsable(student.school)) {
      throw ApiError.unauthorized("Invalid admission number or PIN.");
    }

    if (!student.pinHash) {
      throw ApiError.badRequest(
        "You haven't set up a PIN yet. This happens automatically the first time you buy something at the tuck shop - ask the Seller to help you get started."
      );
    }

    const valid = await compareValue(pin, student.pinHash);
    if (!valid) {
      await recordAudit({ action: "LOGIN_FAILED", schoolId, detail: `Student login failed for ${admissionNumber}`, ipAddress: ip });
      throw ApiError.unauthorized("Invalid admission number or PIN.");
    }

    await recordAudit({ action: "LOGIN_SUCCESS", schoolId, detail: `Student ${student.admissionNumber} logged in`, ipAddress: ip });

    return student;
  },

  async registerStaff(input: {
    schoolId: string;
    role: "ACCOUNTANT" | "SELLER";
    fullName: string;
    email: string;
    phone?: string;
    username: string;
    password: string;
  }) {
    const school = await prisma.school.findUnique({ where: { id: input.schoolId } });
    if (!school || school.status !== SchoolStatus.ACTIVE || school.deletedAt) throw ApiError.badRequest("Invalid or inactive school.");

    // Business rule: only ONE accountant and ONE seller per school (unless previously removed).
    const existingHolder = await prisma.user.findFirst({
      where: { schoolId: input.schoolId, role: input.role as Role },
    });
    if (existingHolder) {
      throw ApiError.conflict(`This school already has a registered ${input.role.toLowerCase()}. Please log in instead.`);
    }

    const [dupEmail, dupUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: input.email } }),
      prisma.user.findUnique({ where: { username: input.username } }),
    ]);
    if (dupEmail) throw ApiError.conflict("This email is already in use.");
    if (dupUsername) throw ApiError.conflict("This username is already taken.");

    const passwordHash = await hashValue(input.password);

    const user = await prisma.user.create({
      data: {
        role: input.role as Role,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        username: input.username,
        passwordHash,
        schoolId: input.schoolId,
        approvalStatus: StaffApprovalStatus.PENDING,
        isActive: true,
      },
    });

    await recordAudit({ action: "STAFF_REGISTERED", actorId: user.id, schoolId: input.schoolId, detail: `${input.role} ${input.fullName} registered` });

    return {
      message: "Your registration has been submitted and is awaiting approval from your School Admin.",
      userId: user.id,
    };
  },

  async registerStudent(input: {
    schoolId: string;
    fullName: string;
    admissionNumber: string;
    className: string;
    house?: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    pin?: string; // optional - Accountant/Housemaster no longer collect a PIN at creation time;
                  // it's set automatically the first time the student makes a tuck shop purchase.
    createdById?: string;
  }) {
    const school = await prisma.school.findUnique({ where: { id: input.schoolId } });
    if (!school || school.status !== SchoolStatus.ACTIVE || school.deletedAt) throw ApiError.badRequest("Invalid or inactive school.");

    const existing = await prisma.student.findUnique({
      where: { schoolId_admissionNumber: { schoolId: input.schoolId, admissionNumber: input.admissionNumber } },
    });
    if (existing) throw ApiError.conflict("A student with this admission number already exists at this school.");

    const pinHash = input.pin ? await hashValue(input.pin) : undefined;
    const pinEncrypted = input.pin ? encryptSecret(input.pin) : undefined;

    const student = await prisma.student.create({
      data: {
        fullName: input.fullName,
        admissionNumber: input.admissionNumber,
        className: input.className,
        house: input.house,
        parentName: input.parentName,
        parentPhone: input.parentPhone,
        parentEmail: input.parentEmail,
        pinHash,
        pinEncrypted,
        schoolId: input.schoolId,
        createdById: input.createdById,
      },
    });

    await recordAudit({
      action: "STUDENT_CREATED",
      actorId: input.createdById,
      schoolId: input.schoolId,
      detail: `Student ${student.fullName} (${student.admissionNumber}) created`,
    });

    return student;
  },

  /**
   * Forgot-password for Admin/Accountant/Seller. Reveals nothing about whether
   * the email matched anything - the same message is returned either way.
   */
  async forgotPassword(schoolId: string, email: string) {
    const user = await findResettableUser(schoolId, email);

    if (user) {
      const code = generateNumericCode(6);
      const codeHash = await hashValue(code);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetCodeHash: codeHash, passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000) },
      });
      await emailService.sendPasswordResetCode(email, user.fullName, code);
      await recordAudit({ action: "PASSWORD_RESET_REQUESTED", actorId: user.id, schoolId });
    }

    return { message: "If that email is registered, a reset code has been sent to it." };
  },

  async resetPassword(schoolId: string, email: string, code: string, newPassword: string) {
    const user = await findResettableUser(schoolId, email);

    if (!user || !user.passwordResetCodeHash || !user.passwordResetExpires) {
      throw ApiError.badRequest("Invalid or expired reset code.");
    }
    if (user.passwordResetExpires < new Date()) {
      throw ApiError.badRequest("This reset code has expired. Request a new one.");
    }

    const validCode = await compareValue(code, user.passwordResetCodeHash);
    if (!validCode) throw ApiError.badRequest("Invalid or expired reset code.");

    const passwordHash = await hashValue(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetCodeHash: null, passwordResetExpires: null },
    });

    await recordAudit({ action: "PASSWORD_RESET_COMPLETED", actorId: user.id, schoolId });

    return { message: "Password updated. You can now log in with your new password." };
  },

  issueSession,

  async refresh(res: Response, cookieValue: string | undefined) {
    if (!cookieValue) throw ApiError.unauthorized("No refresh token present.");

    const [subjectId, role, rawToken] = cookieValue.split(".");
    if (!subjectId || !role || !rawToken) throw ApiError.unauthorized("Malformed refresh token.");

    const isStudent = role === Role.STUDENT;

    const candidates = await prisma.refreshToken.findMany({
      where: isStudent
        ? { studentId: subjectId, revoked: false, expiresAt: { gt: new Date() } }
        : { userId: subjectId, revoked: false, expiresAt: { gt: new Date() } },
    });

    let matched = null;
    for (const candidate of candidates) {
      // eslint-disable-next-line no-await-in-loop
      if (await compareValue(rawToken, candidate.token)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) throw ApiError.unauthorized("Refresh token is invalid or has been revoked.");

    await prisma.refreshToken.update({ where: { id: matched.id }, data: { revoked: true } });

    let schoolId: string | null = null;
    if (isStudent) {
      const student = await prisma.student.findUnique({ where: { id: subjectId }, include: { school: true } });
      if (!student || !student.isActive || !isSchoolUsable(student.school)) throw ApiError.unauthorized("Account no longer active.");
      schoolId = student.schoolId;
    } else {
      const user = await prisma.user.findUnique({ where: { id: subjectId }, include: { school: true } });
      if (!user || !user.isActive) throw ApiError.unauthorized("Account no longer active.");
      // Developer accounts have no linked school (schoolId is null) - only check usability when one exists.
      if (user.school && !isSchoolUsable(user.school)) throw ApiError.unauthorized("Account no longer active.");
      schoolId = user.schoolId;
    }

    const accessToken = await issueSession(res, { id: subjectId, role: role as Role, schoolId, isStudent });
    return accessToken;
  },

  async logout(res: Response, cookieValue: string | undefined) {
    if (cookieValue) {
      const [subjectId, role] = cookieValue.split(".");
      const isStudent = role === Role.STUDENT;
      await prisma.refreshToken.updateMany({
        where: isStudent ? { studentId: subjectId, revoked: false } : { userId: subjectId, revoked: false },
        data: { revoked: true },
      });
    }
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  },
};
