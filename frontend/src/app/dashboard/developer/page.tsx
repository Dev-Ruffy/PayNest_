"use client";

import { useState } from "react";
import { LayoutGrid, School, ShieldCheck, Receipt, Users, FileClock, Settings } from "lucide-react";
import { RequireRole } from "@/components/layout/RequireRole";
import { DashboardShell, NavItem } from "@/components/layout/DashboardShell";
import { OverviewTab } from "@/components/dashboard/developer/OverviewTab";
import { SchoolsTab } from "@/components/dashboard/developer/SchoolsTab";
import { ApprovalsTab } from "@/components/dashboard/developer/ApprovalsTab";
import { UsersTab } from "@/components/dashboard/developer/UsersTab";
import { LogsTab } from "@/components/dashboard/developer/LogsTab";
import { SystemTab } from "@/components/dashboard/developer/SystemTab";
import { TransactionsTable } from "@/components/dashboard/shared/TransactionsTable";
import { useLiveApprovalCount } from "@/lib/useLiveApprovals";

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "schools", label: "Schools", icon: School },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "users", label: "Active Users", icon: Users },
  { id: "logs", label: "Logs", icon: FileClock },
  { id: "system", label: "System", icon: Settings },
];

function DeveloperDashboardContent() {
  const [activeTab, setActiveTab] = useState("overview");
  const pendingSchools = useLiveApprovalCount("developer-verification-requests", "/developer/verification-requests", "school");
  const items = navItems.map((item) => (item.id === "approvals" ? { ...item, badge: pendingSchools } : item));

  return (
    <DashboardShell roleLabel="Developer" navItems={items} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "schools" && <SchoolsTab />}
      {activeTab === "approvals" && <ApprovalsTab />}
      {activeTab === "transactions" && <TransactionsTable endpoint="/developer/transactions" title="All transactions" showSchool />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "logs" && <LogsTab />}
      {activeTab === "system" && <SystemTab />}
    </DashboardShell>
  );
}

export default function DeveloperDashboardPage() {
  return (
    <RequireRole role="DEVELOPER">
      <DeveloperDashboardContent />
    </RequireRole>
  );
}
