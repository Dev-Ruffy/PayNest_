"use client";

import { useQuery } from "@tanstack/react-query";
import { School, Users, GraduationCap, Receipt, Wallet, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";

interface Overview {
  totalSchools: number;
  activeSchools: number;
  pendingSchools: number;
  totalStudents: number;
  totalStaff: number;
  totalTransactions: number;
  totalWalletBalance: number;
  recentFailedLogins: number;
}

export function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["developer-overview"],
    queryFn: async () => (await api.get("/developer/overview")).data.data as Overview,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total schools" value={String(data.totalSchools)} icon={School} tone="ink" />
      <StatCard label="Active schools" value={String(data.activeSchools)} icon={School} tone="emerald" />
      <StatCard label="Pending approval" value={String(data.pendingSchools)} icon={AlertTriangle} tone="brass" />
      <StatCard label="Total students" value={String(data.totalStudents)} icon={GraduationCap} tone="ink" />
      <StatCard label="Active staff" value={String(data.totalStaff)} icon={Users} tone="ink" />
      <StatCard label="Total transactions" value={String(data.totalTransactions)} icon={Receipt} tone="ink" />
      <StatCard label="Total wallet balance" value={formatCurrency(data.totalWalletBalance)} icon={Wallet} tone="emerald" />
      <StatCard label="Failed logins (24h)" value={String(data.recentFailedLogins)} icon={AlertTriangle} tone="brick" />
    </div>
  );
}
