"use client";

import { useState } from "react";
import { GraduationCap, History, Layers } from "lucide-react";
import { RequireRole } from "@/components/layout/RequireRole";
import { DashboardShell, NavItem } from "@/components/layout/DashboardShell";
import { StudentDirectoryTab } from "@/components/dashboard/shared/StudentDirectoryTab";
import { TransactionsTable } from "@/components/dashboard/shared/TransactionsTable";
import { BulkOrdersTab } from "@/components/dashboard/housemaster/BulkOrdersTab";

const navItems: NavItem[] = [
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "bulk-orders", label: "Bulk Orders", icon: Layers },
  { id: "history", label: "Transactions", icon: History },
];

function HousemasterDashboardContent() {
  const [activeTab, setActiveTab] = useState("students");

  return (
    <DashboardShell roleLabel="Housemaster" navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "students" && (
        <StudentDirectoryTab
          listEndpoint="/housemaster/students"
          createEndpoint="/housemaster/students"
          creditEndpoint="/housemaster/credit"
          queryKeyPrefix="housemaster"
        />
      )}
      {activeTab === "bulk-orders" && <BulkOrdersTab />}
      {activeTab === "history" && <TransactionsTable endpoint="/housemaster/transactions" title="All school transactions" />}
    </DashboardShell>
  );
}

export default function HousemasterDashboardPage() {
  return (
    <RequireRole role="HOUSEMASTER">
      <HousemasterDashboardContent />
    </RequireRole>
  );
}
