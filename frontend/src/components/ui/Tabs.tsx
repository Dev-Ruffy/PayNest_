"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-thin border-b border-slate-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
              isActive ? "text-ink" : "text-slate-400 hover:text-ink"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
            {typeof tab.badge === "number" && tab.badge > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brick px-1.5 text-[11px] font-semibold text-parchment">
                {tab.badge}
              </span>
            )}
            {isActive && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brass" />}
          </button>
        );
      })}
    </div>
  );
}
