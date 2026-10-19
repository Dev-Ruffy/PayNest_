"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

export interface ApplyItem {
  productId: string;
  quantity: number;
}

/** A typed quantity becomes a whole number from 1 to 1000. */
const toQuantity = (raw: string) => Math.min(1000, Math.max(1, Math.floor(Number(raw) || 1)));

export function ApplyProductBar({
  products,
  selectedCount,
  onApply,
  isLoading,
  label,
}: {
  products: Product[];
  selectedCount: number;
  onApply: (items: ApplyItem[]) => void;
  isLoading: boolean;
  label: string;
}) {
  // productId -> quantity as typed. A product is "chosen" when it has an entry here.
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(true);

  const pickedIds = Object.keys(picked);
  const disabled = selectedCount === 0 || pickedIds.length === 0;

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = "1";
      return next;
    });

  return (
    <div className="rounded-xl border border-brass/30 bg-brass-50/30 p-3">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="text-xs font-medium text-ink">{label}</span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          {pickedIds.length > 0 ? `${pickedIds.length} chosen` : "Choose products"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="mt-2.5 max-h-56 space-y-1.5 overflow-y-auto scrollbar-thin">
          {products.length === 0 && (
            <p className="py-3 text-center text-xs text-slate-400">The Seller hasn&apos;t added any products yet.</p>
          )}
          {products.map((p) => {
            const chosen = p.id in picked;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 ${chosen ? "border-brass/40 bg-white" : "border-transparent bg-white/60"}`}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brass"
                    checked={chosen}
                    onChange={() => toggle(p.id)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                    <span className="block font-mono text-xs text-slate-400">{formatCurrency(p.price)}</span>
                  </span>
                </label>
                {chosen && (
                  <div className="w-20 shrink-0">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={picked[p.id]}
                      aria-label={`Quantity of ${p.name}`}
                      onChange={(e) => setPicked((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      onBlur={() => setPicked((prev) => ({ ...prev, [p.id]: String(toQuantity(prev[p.id] ?? "1")) }))}
                      className="px-2.5 py-1.5 text-center"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {pickedIds.length > 0 ? (
          <button onClick={() => setPicked({})} className="text-xs text-slate-400 underline hover:text-ink">
            Clear choices
          </button>
        ) : (
          <span />
        )}
        <Button
          size="sm"
          disabled={disabled}
          isLoading={isLoading}
          onClick={() => onApply(pickedIds.map((id) => ({ productId: id, quantity: toQuantity(picked[id] ?? "1") })))}
        >
          Apply to {selectedCount} selected
        </Button>
      </div>
    </div>
  );
}
