"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, extractErrorMessage } from "@/lib/axios";
import { registerStaffSchema, RegisterStaffInput } from "@/lib/validation";

const LABELS: Record<string, string> = { accountant: "Accountant", seller: "Tuck Shop Seller" };

function StaffSignupContent() {
  const params = useParams<{ role: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const schoolId = search.get("schoolId") ?? "";
  const schoolName = search.get("schoolName") ?? "";
  const role = params.role;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterStaffInput>({ resolver: zodResolver(registerStaffSchema) });

  const mutation = useMutation({
    mutationFn: (data: RegisterStaffInput) =>
      api.post("/auth/register/staff", { ...data, schoolId, role: role.toUpperCase() }),
    onSuccess: () => {
      toast.success("Registration submitted for approval.");
      router.push(`/login/${role}?schoolId=${schoolId}&schoolName=${encodeURIComponent(schoolName)}`);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  if (!LABELS[role]) {
    return (
      <AuthLayout title="Unknown role">
        <p className="text-sm text-slate-500">That sign-up type doesn&apos;t exist.</p>
      </AuthLayout>
    );
  }

  if (!schoolId) {
    return (
      <AuthLayout title={`${LABELS[role]} sign up`} subtitle="First, tell us which school you belong to.">
        <Button className="w-full" size="lg" onClick={() => router.push("/join-school")}>
          Find my school
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={`${LABELS[role]} sign up`} subtitle={`${schoolName} - pending your Admin's approval after submission.`}>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <Label>Full name</Label>
          <Input placeholder="Your full name" {...register("fullName")} error={errors.fullName?.message} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" placeholder="you@school.edu" {...register("email")} error={errors.email?.message} />
        </div>
        <div>
          <Label>Phone (optional)</Label>
          <Input placeholder="+234…" {...register("phone")} error={errors.phone?.message} />
        </div>
        <div>
          <Label>Choose a username</Label>
          <Input placeholder="jane.accountant" {...register("username")} error={errors.username?.message} />
        </div>
        <div>
          <Label>Choose a password</Label>
          <Input type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
          Submit for approval
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function StaffSignupPage() {
  return (
    <Suspense>
      <StaffSignupContent />
    </Suspense>
  );
}
