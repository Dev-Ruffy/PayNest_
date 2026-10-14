"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

export function ApplyProductBar({
  products,
  selectedCount,
  onApply,
  isLoading,
  label,
}: {
  products: Product[];
  selectedCount: number;
  onApply: (productId: string, quantity: number) => void;
  isLoading: boolean;
  label: string;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const disabled = selectedCount === 0 || !productId || quantity < 1;

  return (
    <div className="rounded-xl border border-brass/30 bg-brass-50/30 p-3">
      <p className="mb-2 text-xs font-medium text-ink">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[10rem] flex-1">
          <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Choose a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatCurrency(p.price)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-20">
          <Input
            type="number"
            min={1}
            value={quantity}
            aria-label="Quantity"
            onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          />
        </div>
        <Button size="sm" disabled={disabled} isLoading={isLoading} onClick={() => onApply(productId, quantity)}>
          Apply to {selectedCount} selected
        </Button>
      </div>
    </div>
  );
}
