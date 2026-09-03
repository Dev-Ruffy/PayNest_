"use client";

import { useState } from "react";
import { ShoppingBag, History } from "lucide-react";
import { RequireRole } from "@/components/layout/RequireRole";
import { DashboardShell, NavItem } from "@/components/layout/DashboardShell";
import { SellTab } from "@/components/dashboard/seller/SellTab";
import { TransactionsTable } from "@/components/dashboard/shared/TransactionsTable";

const navItems: NavItem[] = [
  { id: "sell", label: "New Sale", icon: ShoppingBag },
  { id: "history", label: "Transaction History", icon: History },
];

function SellerDashboardContent() {
  const [activeTab, setActiveTab] = useState("sell");

  return (
    <DashboardShell roleLabel="Tuck Shop Seller" navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "sell" && <SellTab />}
      {activeTab === "history" && <TransactionsTable endpoint="/seller/transactions" title="Your sales" />}
    </DashboardShell>
  );
}

export default function SellerDashboardPage() {
  return (
    <RequireRole role="SELLER">
      <SellerDashboardContent />
    </RequireRole>
  );
}
