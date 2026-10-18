'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { BatchOrderItem, Product } from '@/types';

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

/** A typed quantity becomes a whole number from 1 to 1000. */
const toQuantity = (raw: string) =>
  Math.min(1000, Math.max(1, Math.floor(Number(raw) || 1)));

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
  // productId -> quantity as typed. A product is in the order when it has an entry here.
  const [lines, setLines] = useState<Record<string, string>>({});
  const [useCustom, setUseCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    const initial: Record<string, string> = {};
    target.items.forEach((i) => {
      if (i.productId) initial[i.productId] = String(i.quantity);
    });
    setLines(initial);
    setUseCustom(target.isCustom);
    setCustomAmount(target.isCustom ? String(target.totalAmount) : '');
    setCustomReason(target.customReason ?? '');
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
      createdAt: '',
    }));
  const displayProducts = [...products, ...legacy];

  const total = displayProducts.reduce(
    (sum, p) =>
      p.id in lines ? sum + Number(p.price) * toQuantity(lines[p.id]) : sum,
    0,
  );

  const toggle = (id: string) =>
    setLines((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = '1';
      return next;
    });

  const save = () => {
    if (!target) return;
    if (useCustom) {
      const amount = Number(customAmount);
      if (!(amount > 0)) return setError('Enter an amount greater than zero.');
      if (customReason.trim().length < 3)
        return setError('A reason is required for a custom amount.');
      return onSave(target.studentId, {
        isCustom: true,
        customAmount: amount,
        customReason: customReason.trim(),
      });
    }
    const items = Object.entries(lines).map(([productId, qty]) => ({
      productId,
      quantity: toQuantity(qty),
    }));
    if (items.length === 0)
      return setError(
        'Choose at least one product, or switch to a custom amount.',
      );
    return onSave(target.studentId, { items });
  };

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target ? `Order for ${target.studentName}` : ''}
      className='max-w-lg'
    >
      {!useCustom && (
        <div className='max-h-72 space-y-1.5 overflow-y-auto scrollbar-thin'>
          {displayProducts.length === 0 && (
            <p className='py-6 text-center text-sm text-slate-400'>
              The Seller hasn&apos;t added any products yet, so there&apos;s
              nothing to pick from.
            </p>
          )}
          {displayProducts.map((p) => {
            const chosen = p.id in lines;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${chosen ? 'border-brass/40 bg-brass-50/40' : 'border-slate-200'}`}
              >
                <label className='flex min-w-0 flex-1 cursor-pointer items-center gap-3'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 shrink-0 rounded border-slate-300 accent-brass'
                    checked={chosen}
                    onChange={() => toggle(p.id)}
                  />
                  <span className='min-w-0'>
                    <span className='block truncate text-sm font-medium text-ink'>
                      {p.name}
                    </span>
                    <span className='block font-mono text-xs text-slate-400'>
                      {formatCurrency(p.price)}
                    </span>
                  </span>
                </label>
                {chosen && (
                  <div className='w-20 shrink-0'>
                    <Input
                      type='number'
                      inputMode='numeric'
                      min={1}
                      step={1}
                      value={lines[p.id]}
                      aria-label={`Quantity of ${p.name}`}
                      onChange={(e) =>
                        setLines((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      onBlur={() =>
                        setLines((prev) => ({
                          ...prev,
                          [p.id]: String(toQuantity(prev[p.id] ?? '1')),
                        }))
                      }
                      className='px-2.5 py-1.5 text-center'
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!useCustom && displayProducts.length > 0 && (
        <p className='mt-2 text-xs text-slate-400'>
          Tick a product, then type how many. The minimum is 1.
        </p>
      )}

      {useCustom && (
        <div className='space-y-3'>
          <p className='rounded-lg bg-brass-50 p-3 text-xs text-brass-700'>
            A custom amount skips the product list and is meant for special
            cases only. It requires a reason and is saved with the order for
            auditing.
          </p>
          <div>
            <Label>Amount</Label>
            <Input
              type='number'
              step='0.01'
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder='1500'
            />
          </div>
          <div>
            <Label>Reason</Label>
            <Input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder='e.g. Birthday treat approved by parent'
            />
          </div>
        </div>
      )}

      {error && <p className='mt-3 text-xs text-brick'>{error}</p>}

      <div className='mt-4 flex items-center justify-between border-t border-slate-100 pt-4'>
        <div>
          <p className='text-xs text-slate-400'>Student total</p>
          <p className='font-mono text-lg text-ink'>
            {formatCurrency(useCustom ? Number(customAmount) || 0 : total)}
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='ghost' size='sm' onClick={onClose}>
            Cancel
          </Button>
          <Button size='sm' onClick={save} isLoading={isSaving}>
            Save order
          </Button>
        </div>
      </div>

      <button
        onClick={() => {
          setUseCustom((c) => !c);
          setError(null);
        }}
        className='mt-3 text-xs text-slate-400 underline hover:text-ink'
      >
        {useCustom
          ? 'Back to the product list'
          : 'Use a custom amount instead (special case)'}
      </button>
    </Modal>
  );
}
