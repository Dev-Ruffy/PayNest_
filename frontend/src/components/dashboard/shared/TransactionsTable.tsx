"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/axios";
import { formatCurrency, formatDate, statusToTone } from "@/lib/utils";
import { PaginatedResult, Transaction } from "@/types";

export function TransactionsTable({ endpoint, title, showSchool }: { endpoint: string; title: string; showSchool?: boolean }) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [endpoint, page],
    queryFn: async () => (await api.get(endpoint, { params: { page } })).data.data as PaginatedResult<Transaction>,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          Page {page} of {totalPages}
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={data?.items ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel="No transactions yet."
          columns={[
            {
              header: "Type",
              accessor: (t) => <Badge tone={t.type === "PURCHASE" ? "brick" : "emerald"}>{t.type}</Badge>,
            },
            {
              header: "Student",
              accessor: (t) => t.senderStudent?.fullName ?? t.receiverStudent?.fullName ?? "—",
            },
            ...(showSchool ? [{ header: "School", accessor: (t: Transaction) => t.school?.name ?? "—" }] : []),
            {
              header: "Amount",
              accessor: (t) => <span className="font-mono">{formatCurrency(t.amount)}</span>,
            },
            {
              header: "By",
              accessor: (t) => (t.createdBy ? `${t.createdBy.fullName} (${t.createdBy.role})` : "—"),
            },
            {
              header: "Status",
              accessor: (t) => <Badge tone={statusToTone(t.status)}>{t.status}</Badge>,
            },
            { header: "Date", accessor: (t) => formatDate(t.createdAt) },
          ]}
        />
      </CardContent>
    </Card>
  );
}
