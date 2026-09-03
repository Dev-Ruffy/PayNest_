import {
  LucideIcon,
  LogIn,
  XCircle,
  School,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  RotateCcw,
  AlertOctagon,
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  GraduationCap,
  ArrowDownCircle,
  ArrowUpCircle,
  Eye,
  KeyRound,
  Settings,
  Activity,
} from "lucide-react";

export type AuditTone = "gold" | "emerald" | "brick" | "slate";

interface ActionMeta {
  label: string;
  tone: AuditTone;
  icon: LucideIcon;
  category: string;
}

export const AUDIT_ACTION_META: Record<string, ActionMeta> = {
  LOGIN_SUCCESS: { label: "Login succeeded", tone: "emerald", icon: LogIn, category: "Authentication" },
  LOGIN_FAILED: { label: "Login failed", tone: "brick", icon: XCircle, category: "Authentication" },
  SCHOOL_REGISTERED: { label: "School registered", tone: "gold", icon: School, category: "Schools" },
  SCHOOL_APPROVED: { label: "School approved", tone: "emerald", icon: CheckCircle2, category: "Schools" },
  SCHOOL_REJECTED: { label: "School rejected", tone: "brick", icon: XCircle, category: "Schools" },
  SCHOOL_VERIFIED: { label: "School verified", tone: "emerald", icon: ShieldCheck, category: "Schools" },
  SCHOOL_DELETED: { label: "School moved to trash", tone: "brick", icon: Trash2, category: "Schools" },
  SCHOOL_RESTORED: { label: "School restored from trash", tone: "emerald", icon: RotateCcw, category: "Schools" },
  SCHOOL_PURGED: { label: "School permanently deleted", tone: "brick", icon: AlertOctagon, category: "Schools" },
  STAFF_REGISTERED: { label: "Staff registered", tone: "gold", icon: UserPlus, category: "Staff" },
  STAFF_APPROVED: { label: "Staff approved", tone: "emerald", icon: UserCheck, category: "Staff" },
  STAFF_REJECTED: { label: "Staff rejected", tone: "brick", icon: UserX, category: "Staff" },
  STAFF_DELETED: { label: "Staff removed", tone: "brick", icon: UserMinus, category: "Staff" },
  STUDENT_CREATED: { label: "Student created", tone: "gold", icon: GraduationCap, category: "Students & Money" },
  WALLET_CREDITED: { label: "Wallet credited", tone: "emerald", icon: ArrowDownCircle, category: "Students & Money" },
  WALLET_DEBITED: { label: "Wallet debited", tone: "brick", icon: ArrowUpCircle, category: "Students & Money" },
  PIN_VIEWED: { label: "PIN viewed", tone: "gold", icon: Eye, category: "Students & Money" },
  HOUSEMASTER_PASSWORD_CHANGED: { label: "Housemaster password changed", tone: "gold", icon: KeyRound, category: "Admin" },
  SETTINGS_UPDATED: { label: "Settings updated", tone: "slate", icon: Settings, category: "Admin" },
};

export const FALLBACK_ACTION_META: ActionMeta = { label: "Activity", tone: "slate", icon: Activity, category: "Other" };

/** Grouped for the filter dropdown's <optgroup> sections. */
export const AUDIT_ACTION_CATEGORIES: { category: string; actions: string[] }[] = [
  { category: "Authentication", actions: ["LOGIN_SUCCESS", "LOGIN_FAILED"] },
  { category: "Schools", actions: ["SCHOOL_REGISTERED", "SCHOOL_APPROVED", "SCHOOL_REJECTED", "SCHOOL_VERIFIED", "SCHOOL_DELETED", "SCHOOL_RESTORED", "SCHOOL_PURGED"] },
  { category: "Staff", actions: ["STAFF_REGISTERED", "STAFF_APPROVED", "STAFF_REJECTED", "STAFF_DELETED"] },
  { category: "Students & Money", actions: ["STUDENT_CREATED", "WALLET_CREDITED", "WALLET_DEBITED", "PIN_VIEWED"] },
  { category: "Admin", actions: ["HOUSEMASTER_PASSWORD_CHANGED", "SETTINGS_UPDATED"] },
];

export const TONE_ICON_BG: Record<AuditTone, string> = {
  emerald: "bg-emerald/10 text-emerald-dim",
  brick: "bg-brick/10 text-brick-dim",
  gold: "bg-brass-50 text-brass-700",
  slate: "bg-slate-100 text-slate-500",
};
