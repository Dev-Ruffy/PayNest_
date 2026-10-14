"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { BatchOrderItem, Product } from "@/types";

export type OrderPayload =
  | { items: { productId: string; quantity: number }[] }
  | { isCustom: true; customAmount: number; customReason: string };

export interface EditorTarget {
  studentId: string;
  studentName: string;
  items: BatchOrderItem[];
  isCustom: boolean;
  customReason: string | null;
  totalAmount: number;
}

export function OrderEditorModal({
  target,
  products,
  onClose,
  onSave,
  isSaving,
}: {
  target: EditorTarget | null;
  products: Product[];
  onClose: () => void;
  onSave: (studentId: string, payload: OrderPayload) => void;
  isSaving: boolean;
}) {
  const [lines, setLines] = useState<Record<string, number>>({});
  const [useCustom, setUseCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    const initial: Record<string, number> = {};
    target.items.forEach((i) => {
      if (i.productId) initial[i.productId] = i.quantity;
    });
    setLines(initial);
    setUseCustom(target.isCustom);
    setCustomAmount(target.isCustom ? String(target.totalAmount) : "");
    setCustomReason(target.customReason ?? "");
    setError(null);
  }, [target]);

  // Products still in an existing order but since deactivated stay editable here, using their saved name/price.
  const activeIds = new Set(products.map((p) => p.id));
  const legacy: Product[] = (target?.items ?? [])
    .filter((i) => i.productId && !activeIds.has(i.productId))
    .map((i) => ({
      id: i.productId as string,
      name: `${i.nameSnapshot} (inactive)`,
      price: i.priceSnapshot,
      isActive: false,
      createdAt: "",
    }));
  const displayProducts = [...products, ...legacy];

  const total = displayProducts.reduce((sum, p) => sum + Number(p.price) * (lines[p.id] ?? 0), 0);

  const setQty = (id: string, qty: number) => setLines((prev) => ({ ...prev, [id]: Math.max(0, qty) }));

  const save = () => {
    if (!target) return;
    if (useCustom) {
      const amount = Number(customAmount);
      if (!(amount > 0)) return setError("Enter an amount greater than zero.");
      if (customReason.trim().length < 3) return setError("A reason is required for a custom amount.");
      return onSave(target.studentId, { isCustom: true, customAmount: amount, customReason: customReason.trim() });
    }
    const items = Object.entries(lines)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return setError("Add at least one product, or switch to a custom amount.");
    return onSave(target.studentId, { items });
  };

  return (
    <Modal open={!!target} onClose={onClose} title={target ? `Order for ${target.studentName}` : ""} className="max-w-lg">
      {!useCustom && (
        <div className="max-h-72 space-y-1.5 overflow-y-auto scrollbar-thin">
          {displayProducts.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              The Seller hasn&apos;t added any products yet, so there&apos;s nothing to pick from.
            </p>
          )}
          {displayProducts.map((p) => {
            const qty = lines[p.id] ?? 0;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${qty > 0 ? "border-brass/40 bg-brass-50/40" : "border-slate-200"}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                  <p className="font-mono text-xs text-slate-400">{formatCurrency(p.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(p.id, qty - 1)}
                    disabled={qty === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                    aria-label={`Remove one ${p.name}`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-mono text-sm">{qty}</span>
                  <button
                    onClick={() => setQty(p.id, qty + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    aria-label={`Add one ${p.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {useCustom && (
        <div className="space-y-3">
          <p className="rounded-lg bg-brass-50 p-3 text-xs text-brass-700">
            A custom amount skips the product list and is meant for special cases only. It requires a reason and is
            saved with the order for auditing.
          </p>
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="1500" />
          </div>
          <div>
            <Label>Reason</Label>
            <Input value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="e.g. Birthday treat approved by parent" />
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-brick">{error}</p>}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs text-slate-400">Student total</p>
          <p className="font-mono text-lg text-ink">{formatCurrency(useCustom ? Number(customAmount) || 0 : total)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} isLoading={isSaving}>
            Save order
          </Button>
        </div>
      </div>

      <button
        onClick={() => {
          setUseCustom((c) => !c);
          setError(null);
        }}
        className="mt-3 text-xs text-slate-400 underline hover:text-ink"
      >
        {useCustom ? "Back to the product list" : "Use a custom amount instead (special case)"}
      </button>
    </Modal>
  );
}
