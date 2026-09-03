"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, extractErrorMessage } from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import { Role } from "@/types";

interface PendingStaff {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export function ApprovalsTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-approvals"],
    queryFn: async () => (await api.get("/admin/approvals")).data.data as PendingStaff[],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-approvals"] });
    queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const approveMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/approvals/${userId}/approve`, {}),
    onSuccess: () => {
      toast.success("Approved.");
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/approvals/${userId}/reject`, {}),
    onSuccess: () => {
      toast.success("Rejected.");
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending staff approvals</CardTitle>
        <CardDescription>New Accountant and Tuck Shop Seller sign-ups wait here until you review them.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        )}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">No pending approvals right now.</p>
        )}

        <div className="space-y-3">
          {data?.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{s.fullName}</p>
                  <Badge tone="gold">{s.role}</Badge>
                </div>
                <p className="text-xs text-slate-400">{s.email ?? s.phone}</p>
                <p className="mt-1 text-xs text-slate-400">Submitted {formatDate(s.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" isLoading={rejectMutation.isPending} onClick={() => rejectMutation.mutate(s.id)}>
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button size="sm" isLoading={approveMutation.isPending} onClick={() => approveMutation.mutate(s.id)}>
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
