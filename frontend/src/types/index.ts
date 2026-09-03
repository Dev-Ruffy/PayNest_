export type Role = "DEVELOPER" | "ADMIN" | "ACCOUNTANT" | "HOUSEMASTER" | "STUDENT" | "SELLER";

export type SchoolStatus = "PENDING_VERIFICATION" | "CODE_SENT" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface School {
  id: string;
  name: string;
  email: string;
  status?: SchoolStatus;
  registrantName?: string;
  registrantDesignation?: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface AuthUser {
  id: string;
  fullName: string;
  schoolId: string | null;
}

export interface SessionState {
  accessToken: string | null;
  role: Role | null;
  user: AuthUser | null;
  isHydrating: boolean;
}

export interface StudentSummary {
  id: string;
  fullName: string;
  admissionNumber: string;
  className: string;
  walletBalance: string | number;
  isActive: boolean;
  createdAt: string;
  hasPin: boolean;
}

export interface StudentProfile extends StudentSummary {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  school: { id: string; name: string };
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  walletBalance: string | number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: "DEPOSIT" | "PURCHASE" | "ADJUSTMENT" | "REVERSAL";
  status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
  amount: string | number;
  description: string | null;
  reference: string;
  createdAt: string;
  items?: string | null;
  senderStudent?: { fullName: string; admissionNumber: string } | null;
  receiverStudent?: { fullName: string; admissionNumber: string } | null;
  createdBy?: { fullName: string; role: Role } | null;
  school?: { name: string };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
  actor?: { fullName: string; role: Role } | null;
  school?: { name: string } | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
}
