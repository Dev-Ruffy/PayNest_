"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { TerminalSquare } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, extractErrorMessage } from "@/lib/axios";
import { useAuth, dashboardPathFor } from "@/context/AuthContext";
import { developerLoginSchema, DeveloperLoginInput } from "@/lib/validation";

export default function DeveloperLoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeveloperLoginInput>({ resolver: zodResolver(developerLoginSchema) });

  const mutation = useMutation({
    mutationFn: (data: DeveloperLoginInput) => api.post("/auth/login/developer", data),
    onSuccess: (res) => {
      const { accessToken, role } = res.data.data;
      setSession(accessToken, null);
      toast.success("Welcome back, developer.");
      router.push(dashboardPathFor(role));
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Invalid developer credentials.")),
  });

  return (
    <AuthLayout title="Developer access" subtitle="Restricted to the PayNest platform team.">
      <div className="mb-5 flex items-center gap-2 rounded-lg bg-ink/5 px-3 py-2 text-xs text-slate-500">
        <TerminalSquare className="h-4 w-4 text-brass-700" />
        This login controls every school on PayNest.
      </div>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <Label>Developer email</Label>
          <Input type="email" placeholder="developer@paynest.app" {...register("email")} error={errors.email?.message} />
        </div>
        <div>
          <Label>Passcode</Label>
          <Input type="password" placeholder="••••••" {...register("passcode")} error={errors.passcode?.message} />
        </div>
        <Button type="submit" className="w-full" size="lg" variant="secondary" isLoading={mutation.isPending}>
          Enter dashboard
        </Button>
      </form>
    </AuthLayout>
  );
}
