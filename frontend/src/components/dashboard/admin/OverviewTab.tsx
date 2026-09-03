"use client";

import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Wallet, Users, Store, Receipt, ShieldAlert } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";

interface Overview {
  studentCount: number;
  accountantOnboarded: boolean;
  housemasterCount: number;
  sellerOnboarded: boolean;
  transactionCount: number;
  pendingApprovals: number;
  totalStudentWalletBalance: number;
}

export function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => (await api.get("/admin/overview")).data.data as Overview,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Students" value={String(data.studentCount)} icon={GraduationCap} tone="ink" />
      <StatCard label="Total wallet balance" value={formatCurrency(data.totalStudentWalletBalance)} icon={Wallet} tone="emerald" />
      <StatCard label="Transactions" value={String(data.transactionCount)} icon={Receipt} tone="ink" />
      <StatCard label="Housemasters" value={String(data.housemasterCount)} icon={Users} tone="ink" />
      <StatCard label="Accountant" value={data.accountantOnboarded ? "Onboarded" : "Not yet"} icon={Users} tone={data.accountantOnboarded ? "emerald" : "brass"} />
      <StatCard label="Tuck Shop Seller" value={data.sellerOnboarded ? "Onboarded" : "Not yet"} icon={Store} tone={data.sellerOnboarded ? "emerald" : "brass"} />
      {data.pendingApprovals > 0 && (
        <StatCard label="Pending approvals" value={String(data.pendingApprovals)} icon={ShieldAlert} tone="brick" hint="Check the Approvals tab" />
      )}
    </div>
  );
}
