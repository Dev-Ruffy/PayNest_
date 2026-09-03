"use client";

import { useState } from "react";
import { GraduationCap, History, Receipt } from "lucide-react";
import { RequireRole } from "@/components/layout/RequireRole";
import { DashboardShell, NavItem } from "@/components/layout/DashboardShell";
import { StudentDirectoryTab } from "@/components/dashboard/shared/StudentDirectoryTab";
import { TransactionsTable } from "@/components/dashboard/shared/TransactionsTable";

const navItems: NavItem[] = [
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "transactions", label: "All Transactions", icon: Receipt },
  { id: "history", label: "Credit History", icon: History },
];

function AccountantDashboardContent() {
  const [activeTab, setActiveTab] = useState("students");

  return (
    <DashboardShell roleLabel="Accountant" navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "students" && (
        <StudentDirectoryTab
          listEndpoint="/accountant/students"
          createEndpoint="/accountant/students"
          creditEndpoint="/accountant/credit"
          queryKeyPrefix="accountant"
        />
      )}
      {activeTab === "transactions" && (
        <TransactionsTable endpoint="/accountant/transactions" title="All school transactions" />
      )}
      {activeTab === "history" && <TransactionsTable endpoint="/accountant/credit-history" title="Your credit history" />}
    </DashboardShell>
  );
}

export default function AccountantDashboardPage() {
  return (
    <RequireRole role="ACCOUNTANT">
      <AccountantDashboardContent />
    </RequireRole>
  );
}
