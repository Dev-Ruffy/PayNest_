"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, extractErrorMessage } from "@/lib/axios";
import { formatDate } from "@/lib/utils";

interface VerificationRequest {
  id: string;
  school: { id: string; name: string; email: string; registrantName: string; registrantDesignation: string; createdAt: string };
}

export function ApprovalsTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["developer-verification-requests"],
    queryFn: async () => (await api.get("/developer/verification-requests")).data.data as VerificationRequest[],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["developer-verification-requests"] });
    queryClient.invalidateQueries({ queryKey: ["developer-schools"] });
    queryClient.invalidateQueries({ queryKey: ["developer-overview"] });
  };

  const approveMutation = useMutation({
    mutationFn: (schoolId: string) => api.post(`/developer/verification-requests/${schoolId}/approve`),
    onSuccess: () => {
      toast.success("Verification code sent to the school.");
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: (schoolId: string) => api.post(`/developer/verification-requests/${schoolId}/reject`, {}),
    onSuccess: () => {
      toast.success("Registration rejected.");
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending school approvals</CardTitle>
        <CardDescription>Review new school registrations before their verification code is sent.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        )}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">No pending approvals. You&apos;re all caught up.</p>
        )}

        <div className="space-y-3">
          {data?.map((req) => (
            <div key={req.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
              <div>
                <p className="font-medium text-ink">{req.school.name}</p>
                <p className="text-xs text-slate-400">
                  {req.school.registrantName} · {req.school.registrantDesignation} · {req.school.email}
                </p>
                <p className="mt-1 text-xs text-slate-400">Submitted {formatDate(req.school.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" isLoading={rejectMutation.isPending} onClick={() => rejectMutation.mutate(req.school.id)}>
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button size="sm" isLoading={approveMutation.isPending} onClick={() => approveMutation.mutate(req.school.id)}>
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
