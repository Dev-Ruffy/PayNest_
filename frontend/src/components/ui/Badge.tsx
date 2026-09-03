import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "gold" | "emerald" | "brick" | "slate";
}

const tones: Record<string, string> = {
  gold: "bg-brass-50 text-brass-700 border-brass-100",
  emerald: "bg-emerald/10 text-emerald-dim border-emerald/20",
  brick: "bg-brick/10 text-brick-dim border-brick/20",
  slate: "bg-slate-50 text-slate-600 border-slate-200",
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
