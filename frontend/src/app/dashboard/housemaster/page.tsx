"use client";

import { useCallback, useState } from "react";
import { GraduationCap, History, Layers, ClipboardList } from "lucide-react";
import { RequireRole } from "@/components/layout/RequireRole";
import { DashboardShell, NavItem } from "@/components/layout/DashboardShell";
import { StudentDirectoryTab } from "@/components/dashboard/shared/StudentDirectoryTab";
import { TransactionsTable } from "@/components/dashboard/shared/TransactionsTable";
import { BulkOrdersTab } from "@/components/dashboard/housemaster/BulkOrdersTab";
import { BatchHistoryTab } from "@/components/dashboard/housemaster/BatchHistoryTab";

const navItems: NavItem[] = [
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "bulk-orders", label: "Bulk Orders", icon: Layers },
  { id: "batch-history", label: "Batch History", icon: ClipboardList },
  { id: "history", label: "Transactions", icon: History },
];

function HousemasterDashboardContent() {
  const [activeTab, setActiveTab] = useState("students");
  // A batch duplicated from the history tab opens as a draft in the Bulk Orders tab.
  const [openDraftId, setOpenDraftId] = useState<string | null>(null);

  const goToDraft = (batchId: string) => {
    setOpenDraftId(batchId);
    setActiveTab("bulk-orders");
  };
  const clearOpenDraft = useCallback(() => setOpenDraftId(null), []);

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
      {activeTab === "bulk-orders" && <BulkOrdersTab initialDraftId={openDraftId} onInitialConsumed={clearOpenDraft} />}
      {activeTab === "batch-history" && <BatchHistoryTab onOpenDraft={goToDraft} />}
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
