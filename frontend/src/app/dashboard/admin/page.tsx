"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, GraduationCap, Users, ShieldCheck, Receipt, FileClock, Settings } from "lucide-react";
import { RequireRole } from "@/components/layout/RequireRole";
import { DashboardShell, NavItem } from "@/components/layout/DashboardShell";
import { OverviewTab } from "@/components/dashboard/admin/OverviewTab";
import { StudentsTab } from "@/components/dashboard/admin/StudentsTab";
import { StaffTab } from "@/components/dashboard/admin/StaffTab";
import { ApprovalsTab } from "@/components/dashboard/admin/ApprovalsTab";
import { AuditLogTab } from "@/components/dashboard/admin/AuditLogTab";
import { SettingsTab } from "@/components/dashboard/admin/SettingsTab";
import { TransactionsTable } from "@/components/dashboard/shared/TransactionsTable";
import { api } from "@/lib/axios";

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "staff", label: "Staff", icon: Users },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "audit", label: "Audit Log", icon: FileClock },
  { id: "settings", label: "Settings", icon: Settings },
];

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await api.get("/admin/settings")).data.data as { name: string },
  });

  return (
    <DashboardShell
      roleLabel="School Admin"
      schoolName={settings?.name}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "students" && <StudentsTab />}
      {activeTab === "staff" && <StaffTab />}
      {activeTab === "approvals" && <ApprovalsTab />}
      {activeTab === "transactions" && <TransactionsTable endpoint="/admin/transactions" title="School transactions" />}
      {activeTab === "audit" && <AuditLogTab />}
      {activeTab === "settings" && <SettingsTab />}
    </DashboardShell>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireRole role="ADMIN">
      <AdminDashboardContent />
    </RequireRole>
  );
}
