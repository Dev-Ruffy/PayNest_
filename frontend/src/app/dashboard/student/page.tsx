"use client";

import { useState } from "react";
import { Wallet, User } from "lucide-react";
import { RequireRole } from "@/components/layout/RequireRole";
import { DashboardShell, NavItem } from "@/components/layout/DashboardShell";
import { WalletTab } from "@/components/dashboard/student/WalletTab";
import { ProfileTab } from "@/components/dashboard/student/ProfileTab";

const navItems: NavItem[] = [
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "profile", label: "Profile", icon: User },
];

function StudentDashboardContent() {
  const [activeTab, setActiveTab] = useState("wallet");

  return (
    <DashboardShell roleLabel="Student" navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "wallet" && <WalletTab />}
      {activeTab === "profile" && <ProfileTab />}
    </DashboardShell>
  );
}

export default function StudentDashboardPage() {
  return (
    <RequireRole role="STUDENT">
      <StudentDashboardContent />
    </RequireRole>
  );
}
