"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, Copy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, extractErrorMessage } from "@/lib/axios";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Batch, BatchOrderStatus } from "@/types";

const ORDER_TONE: Record<BatchOrderStatus, "gold" | "emerald" | "brick" | "slate"> = {
  COMPLETED: "emerald",
  INSUFFICIENT_BALANCE: "gold",
  FAILED: "brick",
  PENDING: "slate",
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 font-display text-xl ${tone ?? "text-ink"}`}>{value}</p>
    </div>
  );
}

export function BatchResultView({
  batchId,
  justConfirmed,
  onBack,
  onOpenDraft,
}: {
  batchId: string;
  justConfirmed: boolean;
  onBack: () => void;
  onOpenDraft: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [onlyIssues, setOnlyIssues] = useState(true);

  const { data: batch, isLoading } = useQuery({
    queryKey: ["batch-detail", batchId],
    queryFn: async () => (await api.get(`/housemaster/batches/${batchId}`)).data.data as Batch,
  });

  const duplicateMutation = useMutation({
    mutationFn: () => api.post(`/housemaster/batches/${batchId}/duplicate`),
    onSuccess: (res) => {
      toast.success("Batch duplicated. Review it and make any changes.");
      queryClient.invalidateQueries({ queryKey: ["housemaster-batches"] });
      onOpenDraft(res.data.data.id);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  if (isLoading || !batch) {
    return <Skeleton className="h-64 w-full" />;
  }

  const orders = batch.orders ?? [];
  const successful = orders.filter((o) => o.status === "COMPLETED");
  const insufficient = orders.filter((o) => o.status === "INSUFFICIENT_BALANCE");
  const failed = orders.filter((o) => o.status === "FAILED");
  const totalDeducted = successful.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const issues = orders.filter((o) => o.status !== "COMPLETED");
  const shown = onlyIssues && issues.length > 0 ? issues : orders;
  const processed = batch.status === "COMPLETED";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink transition-colors">
          <ArrowLeft className="h-4 w-4" /> All batches
        </button>
        <Button size="sm" variant="outline" isLoading={duplicateMutation.isPending} onClick={() => duplicateMutation.mutate()}>
          <Copy className="h-4 w-4" /> Duplicate this batch
        </Button>
      </div>

      {justConfirmed && processed && (
        <div className="flex items-center gap-3 rounded-xl2 border border-emerald/30 bg-emerald/5 p-5">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald" />
          <div>
            <p className="font-display text-lg text-ink">Batch successfully processed</p>
            <p className="text-sm text-slate-500">
              {successful.length} of {orders.length} student{orders.length === 1 ? "" : "s"} charged.
              {issues.length > 0 ? ` ${issues.length} didn't go through; see below.` : ""}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{batch.label ?? `Batch ${batch.id.slice(0, 8)}`}</CardTitle>
            <Badge tone={processed ? "emerald" : "slate"}>{batch.status}</Badge>
          </div>
          <CardDescription>
            {batch.confirmedAt ? `Processed ${formatDate(batch.confirmedAt)}` : `Created ${formatDate(batch.createdAt)}`}
            {batch.createdBy ? ` by ${batch.createdBy.fullName}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!processed && (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
              This batch was {batch.status === "CANCELLED" ? "cancelled" : "not processed"}, so no money moved.
            </p>
          )}
          {processed && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Stat label="Students" value={String(orders.length)} />
              <Stat label="Successful" value={String(successful.length)} tone="text-emerald" />
              <Stat label="Insufficient balance" value={String(insufficient.length)} tone={insufficient.length ? "text-brass-700" : undefined} />
              <Stat label="Failed" value={String(failed.length)} tone={failed.length ? "text-brick" : undefined} />
              <Stat label="Total deducted" value={formatCurrency(totalDeducted)} />
              <Stat label="Credited to seller" value={formatCurrency(totalDeducted)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>{onlyIssues && issues.length > 0 ? "Orders that didn't go through" : "All orders"}</CardTitle>
          {issues.length > 0 && (
            <button onClick={() => setOnlyIssues((v) => !v)} className="text-xs text-slate-500 underline hover:text-ink">
              {onlyIssues ? "Show all orders" : "Show only issues"}
            </button>
          )}
        </CardHeader>
        <CardContent>
          {shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No orders in this batch.</p>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2.5 font-medium">Student</th>
                    <th className="px-3 py-2.5 font-medium">Items</th>
                    <th className="px-3 py-2.5 font-medium">Amount</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3">
                        <p className="font-medium text-ink">{o.student.fullName}</p>
                        <p className="text-xs text-slate-400">{o.student.admissionNumber} · {o.student.className}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-500">{o.items.map((i) => `${i.nameSnapshot} x${i.quantity}`).join(", ") || "—"}</td>
                      <td className="px-3 py-3 font-mono">{formatCurrency(o.totalAmount)}</td>
                      <td className="px-3 py-3">
                        <Badge tone={ORDER_TONE[o.status]}>{o.status.replaceAll("_", " ")}</Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">{o.failureReason ?? (o.isCustom ? `Custom: ${o.customReason}` : "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
