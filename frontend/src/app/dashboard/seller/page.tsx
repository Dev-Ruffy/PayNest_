"use client";

import { useState } from "react";
import { ShoppingBag, History, Package, Layers } from "lucide-react";
import { RequireRole } from "@/components/layout/RequireRole";
import { DashboardShell, NavItem } from "@/components/layout/DashboardShell";
import { SellTab } from "@/components/dashboard/seller/SellTab";
import { ProductsTab } from "@/components/dashboard/seller/ProductsTab";
import { SellerBatchOrdersTab } from "@/components/dashboard/seller/BatchOrdersTab";
import { TransactionsTable } from "@/components/dashboard/shared/TransactionsTable";

const navItems: NavItem[] = [
  { id: "sell", label: "New Sale", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Package },
  { id: "bulk-orders", label: "Bulk Orders", icon: Layers },
  { id: "history", label: "Transaction History", icon: History },
];

function SellerDashboardContent() {
  const [activeTab, setActiveTab] = useState("sell");

  return (
    <DashboardShell roleLabel="Tuck Shop Seller" navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "sell" && <SellTab />}
      {activeTab === "products" && <ProductsTab />}
      {activeTab === "bulk-orders" && <SellerBatchOrdersTab />}
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
