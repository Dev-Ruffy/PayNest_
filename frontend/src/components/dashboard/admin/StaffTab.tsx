"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { UserMinus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api, extractErrorMessage } from "@/lib/axios";
import { formatCurrency, formatDate, statusToTone } from "@/lib/utils";
import { StaffMember } from "@/types";

export function StaffTab() {
  const queryClient = useQueryClient();
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => (await api.get("/admin/staff")).data.data as StaffMember[],
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/staff/${userId}`),
    onSuccess: (res) => {
      toast.success(res.data.data?.message ?? "Staff member removed.");
      setRemoveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff</CardTitle>
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={data ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel="No staff registered yet."
          columns={[
            { header: "Name", accessor: (s) => s.fullName },
            { header: "Role", accessor: (s) => <Badge tone="gold">{s.role}</Badge> },
            { header: "Contact", accessor: (s) => s.email ?? s.phone ?? "-" },
            { header: "Status", accessor: (s) => <Badge tone={statusToTone(s.approvalStatus)}>{s.approvalStatus}</Badge> },
            { header: "Wallet", accessor: (s) => (s.role === "SELLER" ? formatCurrency(s.walletBalance) : "-") },
            { header: "Since", accessor: (s) => formatDate(s.createdAt) },
            {
              header: "",
              accessor: (s) => (
                <button
                  onClick={() => setRemoveTarget(s)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brick hover:text-brick transition-colors"
                >
                  <UserMinus className="h-3.5 w-3.5" /> Remove
                </button>
              ),
            },
          ]}
        />
      </CardContent>

      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title={`Remove ${removeTarget?.fullName}?`}
        description="This frees up their role slot for a new sign-up. This cannot be undone."
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRemoveTarget(null)}>Cancel</Button>
          <Button variant="danger" isLoading={removeMutation.isPending} onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}>
            Remove
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
