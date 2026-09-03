import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        id: string; // user id or student id
        role: Role;
        schoolId: string | null;
      };
    }
  }
}

export {};
