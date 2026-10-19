"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/axios";
import { formatCurrency, formatDate, statusToTone } from "@/lib/utils";
import { PaginatedResult, Transaction } from "@/types";

/** Purchases store what was bought as a JSON list; this turns it back into readable names. */
function parseItems(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    return [raw];
  }
}

export function TransactionsTable({ endpoint, title, showSchool }: { endpoint: string; title: string; showSchool?: boolean }) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: [endpoint, page],
    placeholderData: keepPreviousData,
    queryFn: async () => (await api.get(endpoint, { params: { page } })).data.data as PaginatedResult<Transaction>,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
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
      <CardContent className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <Table
          isLoading={isLoading}
          data={data?.items ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel="No transactions yet."
          columns={[
            {
              header: "Type",
              accessor: (t) => (
                <div className="md:text-left">
                  <Badge tone={t.type === "PURCHASE" ? "brick" : "emerald"}>{t.type}</Badge>
                  {t.description && <p className="mt-1 text-xs text-slate-400">{t.description}</p>}
                </div>
              ),
            },
            {
              header: "Student",
              accessor: (t) => {
                const student = t.senderStudent ?? t.receiverStudent;
                return student ? (
                  <div>
                    <p className="font-medium text-ink">{student.fullName}</p>
                    <p className="text-xs text-slate-400">{student.admissionNumber}</p>
                  </div>
                ) : (
                  "-"
                );
              },
            },
            {
              header: "Items",
              accessor: (t) => {
                const items = parseItems(t.items);
                return items.length > 0 ? <span className="text-slate-600">{items.join(", ")}</span> : "-";
              },
            },
            ...(showSchool ? [{ header: "School", accessor: (t: Transaction) => t.school?.name ?? "-" }] : []),
            {
              header: "Amount",
              accessor: (t) => <span className="font-mono">{formatCurrency(t.amount)}</span>,
            },
            {
              header: "By",
              accessor: (t) => (t.createdBy ? `${t.createdBy.fullName} (${t.createdBy.role})` : "-"),
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
