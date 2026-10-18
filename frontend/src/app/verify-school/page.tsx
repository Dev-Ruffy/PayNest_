"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Clock, CheckCircle2, XCircle, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, extractErrorMessage } from "@/lib/axios";
import { verifyCodeSchema, VerifyCodeInput } from "@/lib/validation";
import { SchoolStatus } from "@/types";

function VerifySchoolContent() {
  const params = useSearchParams();
  const router = useRouter();
  const schoolId = params.get("schoolId") ?? "";
  const [verified, setVerified] = useState(false);

  const { data: status } = useQuery({
    queryKey: ["school-status", schoolId],
    queryFn: async () => {
      const res = await api.get(`/schools/${schoolId}/status`);
      return res.data.data as { status: SchoolStatus; name: string };
    },
    enabled: !!schoolId && !verified,
    refetchInterval: (query) => (query.state.data?.status === "CODE_SENT" ? false : 8000),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeInput>({ resolver: zodResolver(verifyCodeSchema) });

  const mutation = useMutation({
    mutationFn: (data: VerifyCodeInput) => api.post("/auth/verify-school", { schoolId, code: data.code }),
    onSuccess: () => {
      setVerified(true);
      toast.success("School verified! You can now log in.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  if (!schoolId) {
    return (
      <AuthLayout title="Missing school reference">
        <p className="text-sm text-slate-500">
          We couldn&apos;t find a school to verify. Please register your school first.
        </p>
        <Button className="mt-6 w-full" onClick={() => router.push("/signup/school")}>
          Go to registration
        </Button>
      </AuthLayout>
    );
  }

  if (verified) {
    return (
      <AuthLayout title="You're all set">
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald" />
          <p className="mt-4 text-sm text-slate-500">
            {status?.name ?? "Your school"} has been verified. Admins can now log in with the username and password
            created during registration.
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push("/login/admin")}>
            Go to Admin login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (status?.status === "REJECTED") {
    return (
      <AuthLayout title="Registration not approved">
        <div className="flex flex-col items-center py-4 text-center">
          <XCircle className="h-12 w-12 text-brick" />
          <p className="mt-4 text-sm text-slate-500">
            Unfortunately this registration wasn&apos;t approved. Check your school email for details, or contact the
            PayNest developer on{" "}
            <a href="mailto:rufaimuizz@gmail.com" className="font-medium text-ink underline underline-offset-2">
              rufaimuizz@gmail.com
            </a>{" "}
            or WhatsApp{" "}
            <a href="https://wa.me/2349129193132" target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-2">
              09129193132
            </a>
            .
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (status?.status === "CODE_SENT") {
    return (
      <AuthLayout title="Enter your verification code" subtitle={`Sent to the email address for ${status.name}.`}>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <Input
            placeholder="123456"
            maxLength={6}
            className="text-center font-mono text-lg tracking-[0.5em]"
            {...register("code")}
            error={errors.code?.message}
          />
          <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
            Verify school
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Awaiting developer approval">
      <div className="flex flex-col items-center py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brass/10 text-brass-700">
          <Clock className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm text-slate-500">
          A verification code will be sent to your school email after approval by the PayNest developer. This may
          take up to 5 minutes - this page will update automatically.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <MailCheck className="h-4 w-4" />
          Checking status every few seconds…
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifySchoolPage() {
  return (
    <Suspense>
      <VerifySchoolContent />
    </Suspense>
  );
}
