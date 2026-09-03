"use client";

import { useState } from "react";
import { GraduationCap, History } from "lucide-react";
import { RequireRole } from "@/components/layout/RequireRole";
import { DashboardShell, NavItem } from "@/components/layout/DashboardShell";
import { StudentDirectoryTab } from "@/components/dashboard/shared/StudentDirectoryTab";
import { TransactionsTable } from "@/components/dashboard/shared/TransactionsTable";

const navItems: NavItem[] = [
  { id: "students", label: "Students", icon: GraduationCap },
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
          pinViewEndpointBase="/housemaster"
        />
      )}
      {activeTab === "history" && <TransactionsTable endpoint="/housemaster/transactions" title="Your credited transactions" />}
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
