"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Plus, Copy, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { HelpGuide } from "@/components/ui/HelpGuide";
import { api, extractErrorMessage } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Batch, BatchStatus, PaginatedResult } from "@/types";
import { BulkOrderGuide } from "./BulkOrderGuide";

const STATUS_TONE: Record<BatchStatus, "gold" | "emerald" | "brick" | "slate"> = {
  DRAFT: "gold",
  PROCESSING: "gold",
  COMPLETED: "emerald",
  CANCELLED: "slate",
};

type HistoryFilter = "completed" | "cancelled" | "history";

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Discarded" },
  { id: "history", label: "All" },
];

/**
 * Batches at the school, from any Housemaster.
 *  - "drafts": unfinished batches anyone can pick up, plus the New batch button.
 *  - "history": batches that are no longer drafts, with filters.
 */
export function BatchList({
  mode,
  onOpen,
  onDuplicated,
}: {
  mode: "drafts" | "history";
  onOpen: (batch: Pick<Batch, "id" | "status">) => void;
  /** Where to go after duplicating a batch (defaults to opening it as a draft). */
  onDuplicated?: (batchId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<HistoryFilter>("completed");
  const [newOpen, setNewOpen] = useState(false);
  const [label, setLabel] = useState("");

  const statusParam = mode === "drafts" ? "drafts" : filter;

  const { data, isLoading } = useQuery({
    queryKey: ["housemaster-batches", statusParam, page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (await api.get("/housemaster/batches", { params: { status: statusParam, page } })).data.data as PaginatedResult<Batch>,
  });

  const openDraft = (id: string) => (onDuplicated ? onDuplicated(id) : onOpen({ id, status: "DRAFT" }));

  const createMutation = useMutation({
    mutationFn: () => api.post("/housemaster/batches", { label: label.trim() || undefined }),
    onSuccess: (res) => {
      setNewOpen(false);
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["housemaster-batches"] });
      onOpen({ id: res.data.data.id, status: "DRAFT" });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/housemaster/batches/${id}/duplicate`),
    onSuccess: (res) => {
      toast.success("Batch duplicated. Review it and make any changes.");
      queryClient.invalidateQueries({ queryKey: ["housemaster-batches"] });
      openDraft(res.data.data.id);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const createdBy = (b: Batch) => (b.createdById && b.createdById === user?.id ? "You" : b.createdBy?.fullName ?? "-");
  // Who clicked Confirm. Blank for drafts and discarded batches, since nothing was completed.
  const completedBy = (b: Batch) => {
    if (b.status === "DRAFT" || b.status === "CANCELLED") return "-";
    const name = b.confirmedBy?.fullName;
    if ((b.confirmedById && b.confirmedById === user?.id) || (name && name === user?.fullName)) return "You";
    return name ?? "-";
  };

  const columns = [
    {
      header: "Batch",
      accessor: (b: Batch) => (
        <button onClick={() => onOpen(b)} className="flex items-center gap-2 text-left hover:underline">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
            <Layers className="h-4 w-4" />
          </div>
          <span className="font-medium text-ink">{b.label ?? `Batch ${b.id.slice(0, 8)}`}</span>
        </button>
      ),
    },
    { header: "Created by", accessor: (b: Batch) => createdBy(b) },
    { header: "Students", accessor: (b: Batch) => b._count?.orders ?? b.studentCount },
    ...(mode === "history"
      ? [
          { header: "Completed by", accessor: (b: Batch) => completedBy(b) },
          {
            header: "Total charged",
            accessor: (b: Batch) => (b.status === "COMPLETED" ? <span className="font-mono">{formatCurrency(b.totalAmount)}</span> : "-"),
          },
          { header: "Status", accessor: (b: Batch) => <Badge tone={STATUS_TONE[b.status]}>{b.status === "CANCELLED" ? "DISCARDED" : b.status}</Badge> },
        ]
      : []),
    { header: mode === "history" ? "Date" : "Started", accessor: (b: Batch) => formatDate(b.createdAt) },
    {
      header: "",
      accessor: (b: Batch) =>
        mode === "drafts" ? (
          <Button size="sm" variant="outline" onClick={() => onOpen(b)}>
            Continue
          </Button>
        ) : (
          <button
            onClick={() => duplicateMutation.mutate(b.id)}
            disabled={duplicateMutation.isPending}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition-colors hover:border-brass hover:text-ink disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
        ),
    },
  ];

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{mode === "drafts" ? "Bulk orders" : "Batch order history"}</CardTitle>
              <HelpGuide title="How bulk orders work">
                <BulkOrderGuide />
              </HelpGuide>
            </div>
            <CardDescription>
              {mode === "drafts"
                ? "Place tuck shop orders for many students at once. Unfinished drafts below can be continued by any Housemaster at your school."
                : "Every bulk order placed at your school, by any Housemaster."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40" aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {page} / {totalPages}
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40" aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {mode === "drafts" && (
              <Button size="sm" onClick={() => setNewOpen(true)}>
                <Plus className="h-4 w-4" /> New batch
              </Button>
            )}
          </div>
        </div>

        {mode === "history" && (
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilter(f.id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  filter === f.id ? "border-ink bg-ink text-parchment" : "border-slate-200 text-slate-500 hover:border-brass"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={data?.items ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel={
            mode === "drafts"
              ? "No drafts in progress. Click New batch to place a bulk order."
              : "No batch orders here yet."
          }
          columns={columns}
        />
      </CardContent>

      {mode === "drafts" && (
        <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Start a new batch" description="You can add students and products on the next screen.">
          <div className="space-y-3">
            <div>
              <Label>Batch name (optional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Friday tuck shop, JSS block" />
            </div>
            <Button className="w-full" isLoading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create batch
            </Button>
          </div>
        </Modal>
      )}
    </Card>
  );
}
