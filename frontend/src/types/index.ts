export type Role = "DEVELOPER" | "ADMIN" | "ACCOUNTANT" | "HOUSEMASTER" | "STUDENT" | "SELLER";

export type SchoolStatus = "PENDING_VERIFICATION" | "CODE_SENT" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CreditPeriodType = "TERM" | "SESSION";

export interface School {
  id: string;
  name: string;
  email: string;
  status?: SchoolStatus;
  registrantName?: string;
  registrantDesignation?: string;
  createdAt?: string;
  deletedAt?: string | null;
  creditPeriodType?: CreditPeriodType | null;
  creditPeriodMaxAmount?: string | number | null;
  currentPeriodStartedAt?: string | null;
  dailySpendMaxAmount?: string | number | null;
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
  house?: string | null;
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

// ---- Bulk order feature ----

export interface Product {
  id: string;
  name: string;
  price: string | number;
  isActive: boolean;
  createdAt: string;
}

export type BatchStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "CANCELLED";
export type BatchOrderStatus = "PENDING" | "COMPLETED" | "FAILED" | "INSUFFICIENT_BALANCE";

export interface BatchOrderItem {
  id: string;
  productId: string | null;
  nameSnapshot: string;
  priceSnapshot: string | number;
  quantity: number;
  lineTotal: string | number;
}

export interface BatchOrderStudent {
  id: string;
  fullName: string;
  admissionNumber: string;
  className: string;
  house?: string | null;
  walletBalance: string | number;
}

export interface BatchOrder {
  id: string;
  status: BatchOrderStatus;
  totalAmount: string | number;
  isCustom: boolean;
  customReason: string | null;
  failureReason?: string | null;
  student: BatchOrderStudent;
  items: BatchOrderItem[];
}

export interface Batch {
  id: string;
  status: BatchStatus;
  label: string | null;
  totalAmount: string | number;
  studentCount: number;
  confirmedAt: string | null;
  createdAt: string;
  createdById?: string;
  createdBy?: { fullName: string };
  orders?: BatchOrder[];
  liveTotal?: number;
  liveStudentCount?: number;
  _count?: { orders: number };
}

export interface BatchReviewOrder {
  batchOrderId: string;
  student: BatchOrderStudent;
  items: BatchOrderItem[];
  totalAmount: number;
  isCustom: boolean;
  customReason: string | null;
  liveStatus: "READY" | "INSUFFICIENT_BALANCE" | "EMPTY";
  shortfall: number;
}

export interface BatchReview {
  batchId: string;
  label: string | null;
  status: BatchStatus;
  studentCount: number;
  readyCount: number;
  insufficientCount: number;
  grandTotal: number;
  orders: BatchReviewOrder[];
}

export interface BatchConfirmResult {
  batchId: string;
  studentCount: number;
  successCount: number;
  insufficientCount: number;
  failedCount: number;
  totalDeducted: number;
  totalCredited: number;
}

export interface SellerBalanceSummary {
  totalBalance: string | number;
  dailyProfit: string | number;
  dailySaleCount: number;
}

export interface DailyBalanceEntry {
  date: string;
  total: number;
  count: number;
}
