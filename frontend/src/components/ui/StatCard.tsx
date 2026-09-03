import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "ink" | "brass" | "emerald" | "brick";
  hint?: string;
}

const toneStyles: Record<string, string> = {
  ink: "bg-ink text-parchment",
  brass: "bg-brass-gradient text-ink",
  emerald: "bg-emerald text-parchment",
  brick: "bg-brick text-parchment",
};

export function StatCard({ label, value, icon: Icon, tone = "ink", hint }: StatCardProps) {
  return (
    <Card className="p-5 hover:shadow-cardHover transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 font-display text-2xl text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
