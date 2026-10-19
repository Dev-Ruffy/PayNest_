"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Plus, Trash2, RotateCcw, AlertOctagon, Archive } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { Input, Select } from "@/components/ui/Input";
import { api, extractErrorMessage } from "@/lib/axios";
import { formatDate, statusToTone } from "@/lib/utils";
import { registerSchoolSchema, RegisterSchoolInput } from "@/lib/validation";
import { CreditLimitFields } from "@/components/dashboard/shared/CreditLimitFields";

interface SchoolRow {
  id: string;
  name: string;
  email: string;
  status: string;
  registrantName: string;
  createdAt: string;
  deletedAt?: string | null;
  _count: { users: number; students: number; transactions: number };
}

export function SchoolsTab() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"active" | "trash">("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [trashTarget, setTrashTarget] = useState<SchoolRow | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<SchoolRow | null>(null);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");

  const { data: activeSchools, isLoading: loadingActive } = useQuery({
    queryKey: ["developer-schools"],
    queryFn: async () => (await api.get("/developer/schools")).data.data as SchoolRow[],
    enabled: view === "active",
  });

  const { data: trashedSchools, isLoading: loadingTrash } = useQuery({
    queryKey: ["developer-schools-trash"],
    queryFn: async () => (await api.get("/developer/schools/trash")).data.data as SchoolRow[],
    enabled: view === "trash",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterSchoolInput>({ resolver: zodResolver(registerSchoolSchema) });

  const invalidateSchoolLists = () => {
    queryClient.invalidateQueries({ queryKey: ["developer-schools"] });
    queryClient.invalidateQueries({ queryKey: ["developer-schools-trash"] });
    queryClient.invalidateQueries({ queryKey: ["developer-overview"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: RegisterSchoolInput) => api.post("/developer/schools", { ...data, autoActivate: true }),
    onSuccess: () => {
      toast.success("School created.");
      setCreateOpen(false);
      reset();
      invalidateSchoolLists();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const trashMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/developer/schools/${id}`),
    onSuccess: (res) => {
      toast.success(res.data.data?.message ?? "Moved to trash.");
      setTrashTarget(null);
      invalidateSchoolLists();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.post(`/developer/schools/${id}/restore`),
    onSuccess: (res) => {
      toast.success(res.data.data?.message ?? "School restored.");
      invalidateSchoolLists();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const purgeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/developer/schools/${id}/permanent`),
    onSuccess: (res) => {
      toast.success(res.data.data?.message ?? "Permanently deleted.");
      setPurgeTarget(null);
      setPurgeConfirmText("");
      invalidateSchoolLists();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Schools</CardTitle>
        {view === "active" && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create school
          </Button>
        )}
      </CardHeader>

      <div className="px-6">
        <Tabs
          tabs={[
            { id: "active", label: "Active" },
            { id: "trash", label: "Trash", icon: Archive, badge: trashedSchools?.length },
          ]}
          active={view}
          onChange={(id) => setView(id as "active" | "trash")}
        />
      </div>

      <CardContent>
        {view === "active" && (
          <Table
            isLoading={loadingActive}
            data={activeSchools ?? []}
            keyExtractor={(row) => row.id}
            emptyLabel="No schools yet."
            columns={[
              { header: "School", accessor: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-slate-400">{r.email}</p></div> },
              { header: "Status", accessor: (r) => <Badge tone={statusToTone(r.status)}>{r.status.replace("_", " ")}</Badge> },
              { header: "Users", accessor: (r) => r._count.users },
              { header: "Students", accessor: (r) => r._count.students },
              { header: "Transactions", accessor: (r) => r._count.transactions },
              { header: "Registered", accessor: (r) => formatDate(r.createdAt) },
              {
                header: "",
                accessor: (r) => (
                  <button
                    onClick={() => setTrashTarget(r)}
                    className="flex items-center gap-1 rounded-lg p-1.5 text-slate-400 hover:bg-brick/10 hover:text-brick transition-colors"
                    title="Move to trash"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
          />
        )}

        {view === "trash" && (
          <>
            <p className="mb-4 text-sm text-slate-400">
              Schools here keep all their data intact - students, staff, wallets and transaction history - and can be restored any time.
            </p>
            <Table
              isLoading={loadingTrash}
              data={trashedSchools ?? []}
              keyExtractor={(row) => row.id}
              emptyLabel="Trash is empty."
              columns={[
                { header: "School", accessor: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-slate-400">{r.email}</p></div> },
                { header: "Users", accessor: (r) => r._count.users },
                { header: "Students", accessor: (r) => r._count.students },
                { header: "Transactions", accessor: (r) => r._count.transactions },
                { header: "Deleted", accessor: (r) => (r.deletedAt ? formatDate(r.deletedAt) : "-") },
                {
                  header: "",
                  accessor: (r) => (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => restoreMutation.mutate(r.id)}
                        disabled={restoreMutation.isPending}
                        className="flex items-center gap-1 rounded-lg bg-emerald px-2.5 py-1 text-xs text-parchment hover:bg-emerald-soft transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restore
                      </button>
                      <button
                        onClick={() => {
                          setPurgeTarget(r);
                          setPurgeConfirmText("");
                        }}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brick hover:text-brick transition-colors"
                      >
                        <AlertOctagon className="h-3.5 w-3.5" /> Delete forever
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </CardContent>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create a school" description="Bootstraps the school as immediately active.">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-3">
          <Input placeholder="Registrant full name" {...register("registrantName")} error={errors.registrantName?.message} />
          <Select {...register("registrantDesignation")} defaultValue="" error={errors.registrantDesignation?.message}>
            <option value="" disabled>Designation</option>
            <option value="Principal">Principal</option>
            <option value="Head of School">Head of School</option>
            <option value="Admin">Admin</option>
          </Select>
          <Input placeholder="School name" {...register("schoolName")} error={errors.schoolName?.message} />
          <Input placeholder="School email" type="email" {...register("schoolEmail")} error={errors.schoolEmail?.message} />
          <Input placeholder="Admin username" {...register("username")} error={errors.username?.message} />
          <Input placeholder="Admin password" type="password" {...register("password")} error={errors.password?.message} />
          <CreditLimitFields register={register} errors={errors} />
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Create</Button>
        </form>
      </Modal>

      <Modal
        open={!!trashTarget}
        onClose={() => setTrashTarget(null)}
        title={`Move ${trashTarget?.name} to trash?`}
        description="This does not delete anything. The school, its users, students and transactions stay fully intact and you can restore it any time from the Trash tab."
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setTrashTarget(null)}>Cancel</Button>
          <Button variant="danger" isLoading={trashMutation.isPending} onClick={() => trashTarget && trashMutation.mutate(trashTarget.id)}>
            Move to trash
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!purgeTarget}
        onClose={() => {
          setPurgeTarget(null);
          setPurgeConfirmText("");
        }}
        title="Permanently delete this school?"
        description="This cannot be undone. Every user, student, wallet balance and transaction for this school will be destroyed forever."
      >
        <div className="space-y-3">
          <p className="text-sm text-ink">
            Type <span className="font-mono font-semibold">{purgeTarget?.name}</span> to confirm:
          </p>
          <Input
            value={purgeConfirmText}
            onChange={(e) => setPurgeConfirmText(e.target.value)}
            placeholder={purgeTarget?.name}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setPurgeTarget(null); setPurgeConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={purgeConfirmText !== purgeTarget?.name}
              isLoading={purgeMutation.isPending}
              onClick={() => purgeTarget && purgeMutation.mutate(purgeTarget.id)}
            >
              Delete forever
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
