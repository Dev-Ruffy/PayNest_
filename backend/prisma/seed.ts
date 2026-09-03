import { PrismaClient, Role, SchoolStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

const hash = (v: string) => bcrypt.hash(v, 12);

function encryptSecret(plainText: string, keyString: string): string {
  const key = crypto.createHash("sha256").update(keyString).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

async function main() {
  const developerEmail = process.env.DEVELOPER_EMAIL || "developer@paynest.app";
  const pinKey = process.env.PIN_ENCRYPTION_KEY || "seed-only-fallback-key-not-for-prod";

  console.log("🌱 Seeding PayNest...");

  // 1. Developer account
  await prisma.user.upsert({
    where: { email: developerEmail },
    update: {},
    create: {
      role: Role.DEVELOPER,
      fullName: "PayNest Developer",
      email: developerEmail,
      isActive: true,
    },
  });
  console.log(`✔ Developer account ready (${developerEmail})`);

  // 2. Demo school, fully ACTIVE, with one of every staff role + 3 students
  const existingDemo = await prisma.school.findUnique({ where: { email: "admin@brightfield-demo.edu" } });
  if (existingDemo) {
    console.log("↺ Demo school already exists — skipping.");
    return;
  }

  const housemasterPassword = "house-demo-2024";
  const school = await prisma.school.create({
    data: {
      name: "Brightfield International School",
      email: "admin@brightfield-demo.edu",
      registrantName: "Adaeze Okafor",
      registrantDesignation: "Principal",
      registrantUsername: "admin.brightfield",
      status: SchoolStatus.ACTIVE,
      housemasterPasswordHash: await hash(housemasterPassword),
    },
  });

  await prisma.user.create({
    data: {
      role: Role.ADMIN,
      fullName: "Adaeze Okafor",
      username: "admin.brightfield",
      passwordHash: await hash("Password123!"),
      schoolId: school.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      role: Role.ACCOUNTANT,
      fullName: "Tunde Balogun",
      email: "accountant@brightfield-demo.edu",
      username: "accountant.brightfield",
      passwordHash: await hash("Password123!"),
      schoolId: school.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      role: Role.SELLER,
      fullName: "Chioma Eze",
      email: "seller@brightfield-demo.edu",
      username: "seller.brightfield",
      passwordHash: await hash("Password123!"),
      schoolId: school.id,
      isActive: true,
      walletBalance: 0,
    },
  });

  const studentsData = [
    // Has a PIN already — use this one to test ordinary returning-student purchases/logins right away.
    { fullName: "Emeka Johnson", admissionNumber: "BF-0001", className: "JSS 2B", pin: "1234" as string | null },
    // No PIN yet — matches how every real student now arrives (created by staff, no PIN collected).
    // Use these to test the first-purchase PIN-creation flow from the Seller dashboard.
    { fullName: "Fatima Bello", admissionNumber: "BF-0002", className: "SS 1A", pin: null },
    { fullName: "David Nwachukwu", admissionNumber: "BF-0003", className: "JSS 3C", pin: null },
  ];

  for (const s of studentsData) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.student.create({
      data: {
        fullName: s.fullName,
        admissionNumber: s.admissionNumber,
        className: s.className,
        parentName: `${s.fullName.split(" ")[0]}'s Parent`,
        parentPhone: "+2348000000000",
        parentEmail: `${s.admissionNumber.toLowerCase()}@parent.example.com`,
        // eslint-disable-next-line no-await-in-loop
        pinHash: s.pin ? await hash(s.pin) : undefined,
        pinEncrypted: s.pin ? encryptSecret(s.pin, pinKey) : undefined,
        schoolId: school.id,
        walletBalance: 5000,
      },
    });
  }

  console.log(`✔ Demo school "Brightfield International School" seeded.`);
  console.log(`  Admin login  → username: admin.brightfield / password: Password123!`);
  console.log(`  Accountant   → username: accountant.brightfield / password: Password123!`);
  console.log(`  Seller       → username: seller.brightfield / password: Password123!`);
  console.log(`  Housemaster  → shared password: ${housemasterPassword}`);
  console.log(`  Students     → BF-0001 already has PIN 1234 (test returning-student flows).`);
  console.log(`                 BF-0002 and BF-0003 have no PIN yet (test the first-purchase PIN setup flow).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
