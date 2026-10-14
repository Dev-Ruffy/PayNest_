"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { MailCheck, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, extractErrorMessage } from "@/lib/axios";
import { forgotPasswordSchema, ForgotPasswordInput, resetPasswordSchema, ResetPasswordInput } from "@/lib/validation";

type Step = "request" | "reset" | "done";

function ForgotPasswordContent() {
  const search = useSearchParams();
  const schoolId = search.get("schoolId") ?? "";
  const schoolName = search.get("schoolName") ?? "";
  const role = search.get("role") ?? "admin";
  const loginHref = `/login/${role}?schoolId=${schoolId}&schoolName=${encodeURIComponent(schoolName)}`;

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");

  const requestForm = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });
  const resetForm = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const requestMutation = useMutation({
    mutationFn: (data: ForgotPasswordInput) => api.post("/auth/forgot-password", { schoolId, email: data.email }),
    onSuccess: (_res, vars) => {
      setEmail(vars.email);
      setStep("reset");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const resetMutation = useMutation({
    mutationFn: (data: ResetPasswordInput) =>
      api.post("/auth/reset-password", { schoolId, email, code: data.code, newPassword: data.newPassword }),
    onSuccess: () => setStep("done"),
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  if (!schoolId) {
    return (
      <AuthLayout title="Reset your password" subtitle="First, tell us which school you belong to.">
        <Link href="/join-school">
          <Button className="w-full" size="lg">
            Find my school
          </Button>
        </Link>
      </AuthLayout>
    );
  }

  if (step === "done") {
    return (
      <AuthLayout title="Password updated">
        <div className="flex flex-col items-center py-2 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald" />
          <p className="mt-4 text-sm text-slate-500">You can now log in with your new password.</p>
          <Link href={loginHref} className="mt-6 w-full">
            <Button className="w-full">Go to login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (step === "reset") {
    return (
      <AuthLayout title="Enter your reset code" subtitle={`If ${email} is registered${schoolName ? ` at ${schoolName}` : ""}, a 6-digit code is on its way. It expires in 15 minutes.`}>
        <form onSubmit={resetForm.handleSubmit((data) => resetMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>6-digit code</Label>
            <Input
              placeholder="123456"
              maxLength={6}
              className="text-center font-mono text-lg tracking-[0.5em]"
              {...resetForm.register("code")}
              error={resetForm.formState.errors.code?.message}
            />
          </div>
          <div>
            <Label>New password</Label>
            <Input type="password" placeholder="••••••••" {...resetForm.register("newPassword")} error={resetForm.formState.errors.newPassword?.message} />
          </div>
          <Button type="submit" className="w-full" size="lg" isLoading={resetMutation.isPending}>
            Update password
          </Button>
          <button type="button" onClick={() => setStep("request")} className="w-full text-center text-xs text-slate-400 underline hover:text-ink">
            Use a different email or request a new code
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle={`Enter your email${schoolName ? ` for ${schoolName}` : ""} and we'll send you a reset code.`}>
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-ink/5 px-3 py-2 text-xs text-slate-500">
        <MailCheck className="h-4 w-4 text-brass-700" />
        For School Admins, Accountants and Tuck Shop Sellers.
      </div>
      <form onSubmit={requestForm.handleSubmit((data) => requestMutation.mutate(data))} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" placeholder="you@school.edu" {...requestForm.register("email")} error={requestForm.formState.errors.email?.message} />
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={requestMutation.isPending}>
          Send reset code
        </Button>
        <Link href={loginHref} className="block text-center text-sm text-slate-500 underline underline-offset-2 hover:text-ink">
          Back to login
        </Link>
      </form>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}
