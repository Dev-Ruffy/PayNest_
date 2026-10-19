"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { HelpGuide } from "@/components/ui/HelpGuide";
import { api } from "@/lib/axios";
import { formatCurrency, formatDate, statusToTone } from "@/lib/utils";
import { Batch, PaginatedResult } from "@/types";

export function SellerBatchOrdersTab() {
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["seller-batch-orders", page],
    placeholderData: keepPreviousData,
    queryFn: async () => (await api.get("/seller/batch-orders", { params: { page } })).data.data as PaginatedResult<Batch>,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["seller-batch-detail", detailId],
    queryFn: async () => (await api.get(`/seller/batch-orders/${detailId}`)).data.data as Batch,
    enabled: !!detailId,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CardTitle>Bulk orders from Housemasters</CardTitle>
          <HelpGuide title="Bulk orders">
            <p>
              Housemasters can place orders for many students at once. Once a Housemaster confirms a batch, each
              student&apos;s total is deducted from their own wallet and credited to you automatically. Each student
              gets their own separate transaction.
            </p>
            <ul>
              <li>Click a batch to see which students ordered what.</li>
              <li>Students without enough balance are skipped, and you are only credited for orders that went through.</li>
              <li>Prices come from the product list on your Products tab.</li>
            </ul>
          </HelpGuide>
        </div>
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
          emptyLabel="No bulk orders yet."
          columns={[
            {
              header: "Batch",
              accessor: (b) => (
                <button onClick={() => setDetailId(b.id)} className="flex items-center gap-2 text-left hover:underline">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">{b.label ?? `Batch ${b.id.slice(0, 8)}`}</p>
                    <p className="text-xs text-slate-400">by {b.createdBy?.fullName ?? "-"}</p>
                  </div>
                </button>
              ),
            },
            { header: "Students", accessor: (b) => b._count?.orders ?? b.studentCount },
            { header: "Total", accessor: (b) => <span className="font-mono">{formatCurrency(b.totalAmount)}</span> },
            { header: "Status", accessor: (b) => <Badge tone={statusToTone(b.status)}>{b.status}</Badge> },
            { header: "Date", accessor: (b) => formatDate(b.createdAt) },
          ]}
        />
      </CardContent>

      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title={detail?.label ?? "Batch detail"}
        description={detail ? `${detail.orders?.length ?? 0} students · ${formatCurrency(detail.totalAmount)} total` : undefined}
        className="max-w-lg"
      >
        {detailLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {detail && (
          <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-thin">
            {detail.orders?.map((order) => (
              <div key={order.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{order.student.fullName}</p>
                    <p className="text-xs text-slate-400">{order.student.admissionNumber} · {order.student.className}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">{formatCurrency(order.totalAmount)}</p>
                    <Badge tone={statusToTone(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {order.items.map((i) => `${i.nameSnapshot} x${i.quantity}`).join(", ") || "No items"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Card>
  );
}
