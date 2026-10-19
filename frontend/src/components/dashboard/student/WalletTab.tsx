"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet, PlusCircle, MinusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TransactionsTable } from "@/components/dashboard/shared/TransactionsTable";
import { api } from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { StudentProfile } from "@/types";

export function WalletTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["student-me"],
    queryFn: async () => (await api.get("/student/me")).data.data as StudentProfile,
  });

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-ink-gradient text-parchment">
        <CardContent className="py-8">
          {isLoading || !data ? (
            <Skeleton className="h-16 w-56" />
          ) : (
            <>
              <div className="flex items-center gap-2 text-slate-300">
                <Wallet className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Wallet balance</span>
              </div>
              <p className="mt-2 font-mono text-4xl">{formatCurrency(data.walletBalance)}</p>
              <p className="mt-1 text-xs text-slate-400">{data.fullName} · {data.admissionNumber}</p>
            </>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" disabled className="opacity-60">
              <PlusCircle className="h-4 w-4" /> Request credit
            </Button>
            <Button variant="outline" disabled className="border-white/20 bg-white/5 text-parchment opacity-60">
              <MinusCircle className="h-4 w-4" /> Withdraw
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Ask your Housemaster or the Accountant to top up your wallet - self-service credit and withdrawal are coming soon.
          </p>
        </CardContent>
      </Card>

      <TransactionsTable endpoint="/student/transactions" title="Recent activity" />
    </div>
  );
}
