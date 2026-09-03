"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Search, Plus, Wallet, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api, extractErrorMessage } from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { StudentSummary, PaginatedResult } from "@/types";
import { registerStudentSchema, RegisterStudentInput, creditStudentSchema, CreditStudentInput } from "@/lib/validation";

export function StudentDirectoryTab({
  listEndpoint,
  createEndpoint,
  creditEndpoint,
  queryKeyPrefix,
  pinViewEndpointBase,
}: {
  listEndpoint: string;
  createEndpoint: string;
  creditEndpoint: string;
  queryKeyPrefix: string;
  /** If provided (e.g. "/housemaster"), a "View PIN" action is shown, hitting `${base}/students/:id/pin`. Omit to hide it — e.g. for Accountant, who isn't granted this. */
  pinViewEndpointBase?: string;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creditTarget, setCreditTarget] = useState<StudentSummary | null>(null);
  const [pinModalStudent, setPinModalStudent] = useState<StudentSummary | null>(null);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [pinNotSet, setPinNotSet] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [queryKeyPrefix, "students", search],
    queryFn: async () => (await api.get(listEndpoint, { params: { search } })).data.data as PaginatedResult<StudentSummary>,
  });

  const createForm = useForm<RegisterStudentInput>({ resolver: zodResolver(registerStudentSchema) });
  const creditForm = useForm<CreditStudentInput>({ resolver: zodResolver(creditStudentSchema) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "students"] });
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "history"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: RegisterStudentInput) => api.post(createEndpoint, data),
    onSuccess: () => {
      toast.success("Student created. Their PIN will be set automatically at their first tuck shop purchase.");
      setCreateOpen(false);
      createForm.reset();
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const creditMutation = useMutation({
    mutationFn: (data: CreditStudentInput) => api.post(creditEndpoint, { ...data, studentId: creditTarget!.id }),
    onSuccess: () => {
      toast.success(`${creditTarget?.fullName}'s wallet credited.`);
      setCreditTarget(null);
      creditForm.reset();
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const viewPinMutation = useMutation({
    mutationFn: (studentId: string) => api.get(`${pinViewEndpointBase}/students/${studentId}/pin`),
    onSuccess: (res) => {
      if (res.data.data.hasPin) {
        setRevealedPin(res.data.data.pin);
        setPinNotSet(false);
      } else {
        setPinNotSet(true);
      }
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Students</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search…" className="w-48 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New student
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={data?.items ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel="No students found."
          columns={[
            { header: "Name", accessor: (s) => s.fullName },
            { header: "Admission No.", accessor: (s) => <span className="font-mono text-xs">{s.admissionNumber}</span> },
            { header: "Class", accessor: (s) => s.className },
            { header: "Balance", accessor: (s) => <span className="font-mono">{formatCurrency(s.walletBalance)}</span> },
            { header: "PIN", accessor: (s) => <Badge tone={s.hasPin ? "emerald" : "gold"}>{s.hasPin ? "Set" : "Not set yet"}</Badge> },
            { header: "Status", accessor: (s) => <Badge tone={s.isActive ? "emerald" : "slate"}>{s.isActive ? "Active" : "Inactive"}</Badge> },
            {
              header: "",
              accessor: (s) => (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCreditTarget(s)}
                    className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs text-parchment hover:bg-ink-soft transition-colors"
                  >
                    <Wallet className="h-3.5 w-3.5" /> Credit
                  </button>
                  {pinViewEndpointBase && (
                    <button
                      onClick={() => {
                        setPinModalStudent(s);
                        setRevealedPin(null);
                        setPinNotSet(false);
                        viewPinMutation.mutate(s.id);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brass hover:text-ink transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> PIN
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </CardContent>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a student"
        description="Their PIN isn't set here — it's created automatically the first time they buy something at the tuck shop."
      >
        <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-3">
          <Input placeholder="Full name" {...createForm.register("fullName")} error={createForm.formState.errors.fullName?.message} />
          <Input placeholder="Admission number" {...createForm.register("admissionNumber")} error={createForm.formState.errors.admissionNumber?.message} />
          <Input placeholder="Class" {...createForm.register("className")} error={createForm.formState.errors.className?.message} />
          <Input placeholder="Parent / guardian name" {...createForm.register("parentName")} error={createForm.formState.errors.parentName?.message} />
          <Input placeholder="Parent / guardian phone" {...createForm.register("parentPhone")} error={createForm.formState.errors.parentPhone?.message} />
          <Input placeholder="Parent / guardian email" type="email" {...createForm.register("parentEmail")} error={createForm.formState.errors.parentEmail?.message} />
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Create student</Button>
        </form>
      </Modal>

      <Modal open={!!creditTarget} onClose={() => setCreditTarget(null)} title={`Credit ${creditTarget?.fullName}`} description={`Current balance: ${creditTarget ? formatCurrency(creditTarget.walletBalance) : ""}`}>
        <form onSubmit={creditForm.handleSubmit((data) => creditMutation.mutate(data))} className="space-y-3">
          <div>
            <Label>Amount received in cash</Label>
            <Input type="number" step="0.01" placeholder="5000" {...creditForm.register("amount")} error={creditForm.formState.errors.amount?.message} />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input placeholder="e.g. Term 2 top-up" {...creditForm.register("description")} error={creditForm.formState.errors.description?.message} />
          </div>
          <Button type="submit" className="w-full" isLoading={creditMutation.isPending}>Credit wallet</Button>
        </form>
      </Modal>

      <Modal
        open={!!pinModalStudent}
        onClose={() => setPinModalStudent(null)}
        title={pinModalStudent?.fullName}
        description={pinNotSet ? undefined : "This action is recorded in the audit log."}
      >
        <div className="flex flex-col items-center py-4">
          {viewPinMutation.isPending && <p className="text-sm text-slate-400">Decrypting…</p>}
          {!viewPinMutation.isPending && pinNotSet && (
            <p className="max-w-xs text-center text-sm text-slate-500">
              This student hasn&apos;t made their first tuck shop purchase yet, so no PIN has been created.
            </p>
          )}
          {revealedPin && <p className="font-mono text-3xl tracking-[0.4em] text-ink">{revealedPin}</p>}
          <Button variant="ghost" className="mt-4" onClick={() => setPinModalStudent(null)}>
            Close
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
