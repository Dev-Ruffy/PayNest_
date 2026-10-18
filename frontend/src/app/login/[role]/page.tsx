"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, extractErrorMessage } from "@/lib/axios";
import { useAuth, dashboardPathFor } from "@/context/AuthContext";
import {
  staffLoginSchema,
  StaffLoginInput,
  housemasterLoginSchema,
  HousemasterLoginInput,
  studentLoginSchema,
  StudentLoginInput,
} from "@/lib/validation";
import { Role } from "@/types";

const ROLE_META: Record<string, { label: string; endpoint: string; role: Role; canSignUp: boolean }> = {
  admin: { label: "School Admin", endpoint: "/auth/login/staff", role: "ADMIN", canSignUp: false },
  accountant: { label: "Accountant", endpoint: "/auth/login/staff", role: "ACCOUNTANT", canSignUp: true },
  seller: { label: "Tuck Shop Seller", endpoint: "/auth/login/staff", role: "SELLER", canSignUp: true },
  housemaster: { label: "Housemaster / Housemistress", endpoint: "/auth/login/housemaster", role: "HOUSEMASTER", canSignUp: false },
  student: { label: "Student", endpoint: "/auth/login/student", role: "STUDENT", canSignUp: false },
};

function StaffOrAdminForm({
  schoolId,
  schoolName,
  roleSlug,
  meta,
}: {
  schoolId: string;
  schoolName: string;
  roleSlug: string;
  meta: (typeof ROLE_META)[string];
}) {
  const router = useRouter();
  const { setSession } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffLoginInput>({ resolver: zodResolver(staffLoginSchema) });

  const mutation = useMutation({
    mutationFn: (data: StaffLoginInput) => api.post(meta.endpoint, { ...data, schoolId, role: meta.role }),
    onSuccess: (res) => {
      const { accessToken, role, user } = res.data.data;
      setSession(accessToken, user);
      toast.success(`Welcome back, ${user?.fullName ?? meta.label}.`);
      router.push(dashboardPathFor(role));
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Invalid username or password.")),
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div>
        <Label>Username</Label>
        <Input placeholder="your.username" {...register("username")} error={errors.username?.message} />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />
      </div>
      <div className="-mt-1 text-right">
        <Link
          href={`/forgot-password?schoolId=${schoolId}&schoolName=${encodeURIComponent(schoolName)}&role=${roleSlug}`}
          className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-ink"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
        Log in
      </Button>
    </form>
  );
}

function HousemasterForm({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const { setSession } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HousemasterLoginInput>({ resolver: zodResolver(housemasterLoginSchema) });

  const mutation = useMutation({
    mutationFn: (data: HousemasterLoginInput) => api.post("/auth/login/housemaster", { ...data, schoolId }),
    onSuccess: (res) => {
      const { accessToken, role, user } = res.data.data;
      setSession(accessToken, user);
      toast.success(`Welcome, ${user?.fullName}.`);
      router.push(dashboardPathFor(role));
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Invalid name or shared password.")),
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div>
        <Label>Your full name</Label>
        <Input placeholder="e.g. Mr. Bassey" {...register("fullName")} error={errors.fullName?.message} />
      </div>
      <div>
        <Label>Shared Housemaster password</Label>
        <Input type="password" placeholder="Provided by your School Admin" {...register("sharedPassword")} error={errors.sharedPassword?.message} />
      </div>
      <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
        Log in
      </Button>
    </form>
  );
}

function StudentForm({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const { setSession } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentLoginInput>({ resolver: zodResolver(studentLoginSchema) });

  const mutation = useMutation({
    mutationFn: (data: StudentLoginInput) => api.post("/auth/login/student", { ...data, schoolId }),
    onSuccess: (res) => {
      const { accessToken, role, user } = res.data.data;
      setSession(accessToken, user);
      toast.success(`Welcome back, ${user?.fullName}.`);
      router.push(dashboardPathFor(role));
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Invalid admission number or PIN.")),
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div>
        <Label>Admission number</Label>
        <Input placeholder="BF-0001" {...register("admissionNumber")} error={errors.admissionNumber?.message} />
      </div>
      <div>
        <Label>PIN</Label>
        <Input type="password" inputMode="numeric" placeholder="••••" {...register("pin")} error={errors.pin?.message} />
      </div>
      <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
        Log in
      </Button>
    </form>
  );
}

function LoginContent() {
  const params = useParams<{ role: string }>();
  const search = useSearchParams();
  const schoolId = search.get("schoolId") ?? "";
  const schoolName = search.get("schoolName") ?? "";
  const meta = ROLE_META[params.role];

  if (!meta) {
    return (
      <AuthLayout title="Unknown role">
        <p className="text-sm text-slate-500">That login type doesn&apos;t exist.</p>
      </AuthLayout>
    );
  }

  if (!schoolId) {
    return (
      <AuthLayout title={`${meta.label} login`} subtitle="First, tell us which school you belong to.">
        <Link href="/join-school">
          <Button className="w-full" size="lg">
            Find my school
          </Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={`${meta.label} login`} subtitle={schoolName || undefined}>
      {meta.role === "HOUSEMASTER" && <HousemasterForm schoolId={schoolId} />}
      {meta.role === "STUDENT" && <StudentForm schoolId={schoolId} />}
      {(meta.role === "ADMIN" || meta.role === "ACCOUNTANT" || meta.role === "SELLER") && (
        <StaffOrAdminForm schoolId={schoolId} schoolName={schoolName} roleSlug={params.role} meta={meta} />
      )}

      {meta.canSignUp && (
        <p className="mt-5 text-center text-sm text-slate-500">
          New here?{" "}
          <Link
            href={`/signup/${params.role}?schoolId=${schoolId}&schoolName=${encodeURIComponent(schoolName)}`}
            className="font-medium text-ink underline underline-offset-2"
          >
            Sign up instead
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}

export default function RoleLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
