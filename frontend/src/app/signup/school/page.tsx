"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, extractErrorMessage } from "@/lib/axios";
import { registerSchoolSchema, RegisterSchoolInput } from "@/lib/validation";

export default function RegisterSchoolPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchoolInput>({ resolver: zodResolver(registerSchoolSchema) });

  const mutation = useMutation({
    mutationFn: (data: RegisterSchoolInput) => api.post("/auth/register-school", data),
    onSuccess: (res) => {
      const schoolId = res.data?.data?.schoolId;
      toast.success("Registration submitted!");
      router.push(`/verify-school?schoolId=${schoolId}`);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <AuthLayout
      title="Register your school"
      subtitle="A PayNest developer will review your school and email a verification code — usually within a few minutes."
    >
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <Label>Your full name</Label>
          <Input placeholder="Adaeze Okafor" {...register("registrantName")} error={errors.registrantName?.message} />
        </div>
        <div>
          <Label>Designation</Label>
          <Select {...register("registrantDesignation")} error={errors.registrantDesignation?.message} defaultValue="">
            <option value="" disabled>
              Select your designation
            </option>
            <option value="Principal">Principal</option>
            <option value="Head of School">Head of School</option>
            <option value="Admin">Admin</option>
          </Select>
        </div>
        <div>
          <Label>School name</Label>
          <Input placeholder="Brightfield International School" {...register("schoolName")} error={errors.schoolName?.message} />
        </div>
        <div>
          <Label>School email</Label>
          <Input type="email" placeholder="admin@yourschool.edu" {...register("schoolEmail")} error={errors.schoolEmail?.message} />
        </div>
        <div>
          <Label>Choose a username</Label>
          <Input placeholder="admin.brightfield" {...register("username")} error={errors.username?.message} />
        </div>
        <div>
          <Label>Choose a password</Label>
          <Input type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
          Submit for review
        </Button>

        <p className="text-center text-sm text-slate-500">
          Already registered?{" "}
          <a href="/join-school" className="font-medium text-ink underline underline-offset-2">
            Join your existing school
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}
