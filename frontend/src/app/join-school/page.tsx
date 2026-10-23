"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Wallet, GraduationCap, Users, Store, ChevronLeft } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/axios";
import { School } from "@/types";

const roleCards = [
  { role: "admin", label: "School Admin", icon: ShieldCheck, canSignUp: false },
  { role: "accountant", label: "Accountant", icon: Wallet, canSignUp: true },
  { role: "housemaster", label: "Housemaster", icon: Users, canSignUp: false },
  { role: "student", label: "Student", icon: GraduationCap, canSignUp: false },
  { role: "seller", label: "Tuck Shop Seller", icon: Store, canSignUp: true },
];

function JoinSchoolContent() {
  // Coming back from a login page brings the school along in the address, so the role screen shows straight away.
  const urlParams = useSearchParams();
  const presetId = urlParams.get("schoolId");
  const presetName = urlParams.get("schoolName");

  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(() =>
    presetId && presetName ? { id: presetId, name: presetName, email: "" } : null
  );

  const chooseDifferentSchool = () => {
    setSelectedSchool(null);
    if (typeof window !== "undefined") window.history.replaceState(null, "", "/join-school");
  };

  const { data: schools, isLoading } = useQuery({
    queryKey: ["active-schools"],
    queryFn: async () => {
      const res = await api.get("/schools");
      return res.data.data as School[];
    },
  });

  const filtered = useMemo(
    () => (schools ?? []).filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [schools, search]
  );

  if (!selectedSchool) {
    return (
      <AuthLayout title="Find your school" subtitle="Search for your school to continue." wide>
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search schools…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin">
          {isLoading &&
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

          {!isLoading && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">No matching schools found.</p>
          )}

          {filtered.map((school) => (
            <button
              key={school.id}
              onClick={() => setSelectedSchool(school)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-brass hover:bg-brass-50/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink font-display text-brass">
                {school.name[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{school.name}</p>
                <p className="truncate text-xs text-slate-400">{school.email}</p>
              </div>
            </button>
          ))}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={selectedSchool.name} subtitle="Choose your role to continue." wide>
      <button
        onClick={chooseDifferentSchool}
        className="mb-5 flex items-center gap-1 text-sm text-slate-400 hover:text-ink transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Choose a different school
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        {roleCards.map((card, i) => {
          const showSignUp = card.canSignUp;

          return (
            <motion.div
              key={card.role}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-brass">
                <card.icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-medium text-ink">{card.label}</p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/login/${card.role}?schoolId=${selectedSchool.id}&schoolName=${encodeURIComponent(selectedSchool.name)}`}
                  className="flex-1 rounded-lg bg-ink px-3 py-1.5 text-center text-xs font-medium text-parchment hover:bg-ink-soft transition-colors"
                >
                  Log in
                </Link>
                {showSignUp && (
                  <Link
                    href={`/signup/${card.role}?schoolId=${selectedSchool.id}&schoolName=${encodeURIComponent(selectedSchool.name)}`}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-center text-xs font-medium text-ink hover:bg-slate-50 transition-colors"
                  >
                    Sign up
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </AuthLayout>
  );
}

export default function JoinSchoolPage() {
  return (
    <Suspense>
      <JoinSchoolContent />
    </Suspense>
  );
}
