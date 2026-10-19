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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Batch, BatchStatus, PaginatedResult } from "@/types";
import { BulkOrderGuide } from "./BulkOrderGuide";

const STATUS_TONE: Record<BatchStatus, "gold" | "emerald" | "brick" | "slate"> = {
  DRAFT: "gold",
  PROCESSING: "gold",
  COMPLETED: "emerald",
  CANCELLED: "slate",
};

export function BatchList({ onOpen }: { onOpen: (batch: Pick<Batch, "id" | "status">) => void }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(false);
  const [label, setLabel] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["housemaster-batches", page],
    placeholderData: keepPreviousData,
    queryFn: async () => (await api.get("/housemaster/batches", { params: { page } })).data.data as PaginatedResult<Batch>,
  });

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
      onOpen({ id: res.data.data.id, status: "DRAFT" });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Bulk orders</CardTitle>
            <HelpGuide title="How bulk orders work">
              <BulkOrderGuide />
            </HelpGuide>
          </div>
          <CardDescription>Place tuck shop orders for many students at once.</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {page} / {totalPages}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New batch
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={data?.items ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel="No batches yet. Click New batch to place your first bulk order."
          columns={[
            {
              header: "Batch",
              accessor: (b) => (
                <button onClick={() => onOpen(b)} className="flex items-center gap-2 text-left hover:underline">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-ink">{b.label ?? `Batch ${b.id.slice(0, 8)}`}</span>
                </button>
              ),
            },
            { header: "Students", accessor: (b) => b._count?.orders ?? b.studentCount },
            { header: "Total charged", accessor: (b) => (b.status === "COMPLETED" ? <span className="font-mono">{formatCurrency(b.totalAmount)}</span> : "-") },
            { header: "Status", accessor: (b) => <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge> },
            { header: "Created", accessor: (b) => formatDate(b.createdAt) },
            {
              header: "",
              accessor: (b) => (
                <button
                  onClick={() => duplicateMutation.mutate(b.id)}
                  disabled={duplicateMutation.isPending}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brass hover:text-ink transition-colors disabled:opacity-50"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
              ),
            },
          ]}
        />
      </CardContent>

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
    </Card>
  );
}
