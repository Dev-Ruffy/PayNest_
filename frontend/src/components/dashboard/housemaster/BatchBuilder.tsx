'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Trash2,
  Pencil,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { HelpGuide } from '@/components/ui/HelpGuide';
import { api, extractErrorMessage } from '@/lib/axios';
import { formatCurrency, cn } from '@/lib/utils';
import {
  BatchReview,
  BatchReviewOrder,
  PaginatedResult,
  Product,
  StudentSummary,
} from '@/types';
import { ApplyProductBar, ApplyItem } from './ApplyProductBar';
import {
  OrderEditorModal,
  OrderPayload,
  EditorTarget,
} from './OrderEditorModal';
import { BulkOrderGuide } from './BulkOrderGuide';

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

type StatusFilter = 'ALL' | 'READY' | 'INSUFFICIENT_BALANCE' | 'EMPTY';

function StatusBadge({ order }: { order: BatchReviewOrder }) {
  if (order.liveStatus === 'READY') return <Badge tone='emerald'>Ready</Badge>;
  if (order.liveStatus === 'INSUFFICIENT_BALANCE') {
    return (
      <Badge tone='brick'>Short by {formatCurrency(order.shortfall)}</Badge>
    );
  }
  return <Badge tone='slate'>No items</Badge>;
}

function SummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className='rounded-xl border border-slate-200 bg-white p-4'>
      <p className='text-xs uppercase tracking-wide text-slate-400'>{label}</p>
      <p className={cn('mt-1 font-display text-xl', tone ?? 'text-ink')}>
        {value}
      </p>
    </div>
  );
}

export function BatchBuilder({
  batchId,
  onBack,
  onConfirmed,
}: {
  batchId: string;
  onBack: () => void;
  onConfirmed: (batchId: string) => void;
}) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [className, setClassName] = useState('');
  const [house, setHouse] = useState('');
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());
  const [tableSelected, setTableSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  // Bumping a key resets the matching product chooser after a successful apply.
  const [pickerBarKey, setPickerBarKey] = useState(0);
  const [tableBarKey, setTableBarKey] = useState(0);

  const { data: products } = useQuery({
    queryKey: ['housemaster-products'],
    queryFn: async () =>
      (await api.get('/housemaster/products')).data.data as Product[],
  });

  const { data: groupings } = useQuery({
    queryKey: ['housemaster-groupings'],
    queryFn: async () =>
      (await api.get('/housemaster/students/groupings')).data.data as {
        classNames: string[];
        houses: string[];
      },
  });

  const { data: pickerData, isLoading: pickerLoading } = useQuery({
    queryKey: ['housemaster-picker', debouncedSearch, className, house],
    queryFn: async () =>
      (
        await api.get('/housemaster/students', {
          params: {
            search: debouncedSearch || undefined,
            className: className || undefined,
            house: house || undefined,
            pageSize: 200,
          },
        })
      ).data.data as PaginatedResult<StudentSummary>,
  });

  const { data: review, isLoading: reviewLoading } = useQuery({
    queryKey: ['batch-review', batchId],
    queryFn: async () =>
      (await api.get(`/housemaster/batches/${batchId}/review`)).data
        .data as BatchReview,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['batch-review', batchId] });
    queryClient.invalidateQueries({ queryKey: ['housemaster-batches'] });
  };

  const addMutation = useMutation({
    mutationFn: (studentIds: string[]) =>
      api.post(`/housemaster/batches/${batchId}/students`, { studentIds }),
    onSuccess: (res) => {
      toast.success(`${res.data.data.added} student(s) added.`);
      setPickerSelected(new Set());
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      await Promise.all(
        studentIds.map((id) =>
          api.delete(`/housemaster/batches/${batchId}/students/${id}`),
        ),
      );
    },
    onSuccess: () => {
      setTableSelected(new Set());
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const applyMutation = useMutation({
    mutationFn: (vars: { studentIds: string[]; items: ApplyItem[] }) =>
      api.post(`/housemaster/batches/${batchId}/apply-product`, vars),
    onSuccess: (res) => {
      toast.success(
        `${res.data.data.productCount} product(s) applied to ${res.data.data.appliedCount} student(s).`,
      );
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const setOrderMutation = useMutation({
    mutationFn: (vars: { studentId: string; payload: OrderPayload }) =>
      api.put(
        `/housemaster/batches/${batchId}/students/${vars.studentId}/order`,
        vars.payload,
      ),
    onSuccess: () => {
      toast.success('Order updated.');
      setEditorTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/housemaster/batches/${batchId}/confirm`),
    onSuccess: () => {
      setConfirmOpen(false);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['batch-detail', batchId] });
      onConfirmed(batchId);
    },
    onError: (err) => {
      setConfirmOpen(false);
      toast.error(extractErrorMessage(err));
      invalidate();
    },
  });

  const discardMutation = useMutation({
    mutationFn: () => api.delete(`/housemaster/batches/${batchId}`),
    onSuccess: () => {
      toast.success('Batch discarded.');
      queryClient.invalidateQueries({ queryKey: ['housemaster-batches'] });
      onBack();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const pickerStudents = pickerData?.items ?? [];
  const inBatchIds = useMemo(
    () => new Set((review?.orders ?? []).map((o) => o.student.id)),
    [review],
  );
  const allPickerSelected =
    pickerStudents.length > 0 &&
    pickerStudents.every((s) => pickerSelected.has(s.id));

  const orders = review?.orders ?? [];
  const filteredOrders =
    statusFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.liveStatus === statusFilter);
  const allTableSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => tableSelected.has(o.student.id));
  const emptyCount = orders.filter((o) => o.liveStatus === 'EMPTY').length;

  const openEditor = (o: BatchReviewOrder) =>
    setEditorTarget({
      studentId: o.student.id,
      studentName: o.student.fullName,
      items: o.items,
      isCustom: o.isCustom,
      customReason: o.customReason,
      totalAmount: o.totalAmount,
    });

  const filterChips: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: orders.length },
    { id: 'READY', label: 'Ready', count: review?.readyCount ?? 0 },
    {
      id: 'INSUFFICIENT_BALANCE',
      label: 'Insufficient',
      count: review?.insufficientCount ?? 0,
    },
    { id: 'EMPTY', label: 'No items', count: emptyCount },
  ];

  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <button
          onClick={onBack}
          className='flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink transition-colors'
        >
          <ArrowLeft className='h-4 w-4' /> All batches
        </button>
        <div className='flex items-center gap-2'>
          <HelpGuide title='How bulk orders work'>
            <BulkOrderGuide />
          </HelpGuide>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setDiscardOpen(true)}
          >
            Discard draft
          </Button>
          <Button
            size='sm'
            disabled={!review || review.studentCount === 0}
            onClick={() => setConfirmOpen(true)}
          >
            <ShieldCheck className='h-4 w-4' /> Review &amp; confirm
          </Button>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <SummaryBox
          label='Students in batch'
          value={String(review?.studentCount ?? 0)}
        />
        <SummaryBox
          label='Ready'
          value={String(review?.readyCount ?? 0)}
          tone='text-emerald'
        />
        <SummaryBox
          label='Insufficient balance'
          value={String(review?.insufficientCount ?? 0)}
          tone={review?.insufficientCount ? 'text-brick' : undefined}
        />
        <SummaryBox
          label='Batch total'
          value={formatCurrency(review?.grandTotal ?? 0)}
        />
      </div>

      <div className='grid gap-5 xl:grid-cols-[22rem_1fr]'>
        {/* ---------- Student picker ---------- */}
        <Card className='self-start'>
          <CardHeader>
            <CardTitle>Find students</CardTitle>
            <CardDescription>
              Tick students, then add them or apply a product to all of them.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
              <Input
                placeholder='Name or admission number…'
                className='pl-9'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <Select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              >
                <option value=''>All classes</option>
                {groupings?.classNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select value={house} onChange={(e) => setHouse(e.target.value)}>
                <option value=''>All houses</option>
                {groupings?.houses.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </div>

            <div className='flex items-center justify-between text-xs text-slate-500'>
              <label className='flex cursor-pointer items-center gap-2'>
                <input
                  type='checkbox'
                  className='h-4 w-4 rounded border-slate-300 accent-brass'
                  checked={allPickerSelected}
                  onChange={() =>
                    setPickerSelected(
                      allPickerSelected
                        ? new Set()
                        : new Set(pickerStudents.map((s) => s.id)),
                    )
                  }
                />
                Select all ({pickerStudents.length})
              </label>
              <span>{pickerSelected.size} selected</span>
            </div>

            <div className='max-h-80 space-y-1 overflow-y-auto scrollbar-thin'>
              {pickerLoading && <Skeleton className='h-12 w-full' />}
              {!pickerLoading && pickerStudents.length === 0 && (
                <p className='py-6 text-center text-sm text-slate-400'>
                  No students match.
                </p>
              )}
              {pickerStudents.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
                    pickerSelected.has(s.id)
                      ? 'border-brass/50 bg-brass-50/40'
                      : 'border-slate-100 hover:bg-slate-50',
                  )}
                >
                  <input
                    type='checkbox'
                    className='h-4 w-4 rounded border-slate-300 accent-brass'
                    checked={pickerSelected.has(s.id)}
                    onChange={() =>
                      setPickerSelected((prev) => toggleInSet(prev, s.id))
                    }
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium text-ink'>
                      {s.fullName}
                    </p>
                    <p className='truncate text-xs text-slate-400'>
                      {s.admissionNumber} · {s.className}
                      {s.house ? ` · ${s.house}` : ''}
                    </p>
                  </div>
                  {inBatchIds.has(s.id) && <Badge tone='slate'>In batch</Badge>}
                </label>
              ))}
            </div>
            {pickerData && pickerData.total > pickerStudents.length && (
              <p className='text-xs text-slate-400'>
                Showing the first {pickerStudents.length} of {pickerData.total}.
                Narrow with a class or house filter to reach the rest.
              </p>
            )}

            <Button
              className='w-full'
              variant='outline'
              disabled={pickerSelected.size === 0}
              isLoading={addMutation.isPending}
              onClick={() => addMutation.mutate(Array.from(pickerSelected))}
            >
              <UserPlus className='h-4 w-4' /> Add {pickerSelected.size} to
              batch
            </Button>

            <ApplyProductBar
              key={pickerBarKey}
              label='Give all selected students the same products'
              products={products ?? []}
              selectedCount={pickerSelected.size}
              isLoading={applyMutation.isPending}
              onApply={(items) =>
                applyMutation.mutate(
                  { studentIds: Array.from(pickerSelected), items },
                  {
                    onSuccess: () => {
                      setPickerSelected(new Set());
                      setPickerBarKey((k) => k + 1);
                    },
                  },
                )
              }
            />
          </CardContent>
        </Card>

        {/* ---------- Batch table ---------- */}
        <Card className='min-w-0'>
          <CardHeader className='space-y-3'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <CardTitle>{review?.label ?? 'Batch orders'}</CardTitle>
                <CardDescription>
                  Totals are calculated automatically from the Seller&apos;s
                  price list.
                </CardDescription>
              </div>
              <div className='flex flex-wrap gap-1.5'>
                {filterChips.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setStatusFilter(chip.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      statusFilter === chip.id
                        ? 'border-ink bg-ink text-parchment'
                        : 'border-slate-200 text-slate-500 hover:border-brass',
                    )}
                  >
                    {chip.label} ({chip.count})
                  </button>
                ))}
              </div>
            </div>

            {tableSelected.size > 0 && (
              <div className='space-y-2'>
                <ApplyProductBar
                  key={tableBarKey}
                  label={`Add products to the ${tableSelected.size} selected student(s) in the batch`}
                  products={products ?? []}
                  selectedCount={tableSelected.size}
                  isLoading={applyMutation.isPending}
                  onApply={(items) =>
                    applyMutation.mutate(
                      { studentIds: Array.from(tableSelected), items },
                      {
                        onSuccess: () => {
                          setTableSelected(new Set());
                          setTableBarKey((k) => k + 1);
                        },
                      },
                    )
                  }
                />
                <Button
                  size='sm'
                  variant='outline'
                  isLoading={removeMutation.isPending}
                  onClick={() =>
                    removeMutation.mutate(Array.from(tableSelected))
                  }
                >
                  <Trash2 className='h-4 w-4' /> Remove {tableSelected.size}{' '}
                  selected from batch
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {reviewLoading && <Skeleton className='h-40 w-full' />}
            {!reviewLoading && orders.length === 0 && (
              <div className='flex flex-col items-center gap-2 py-12 text-center'>
                <p className='text-sm text-slate-500'>
                  No students in this batch yet.
                </p>
                <p className='max-w-xs text-xs text-slate-400'>
                  Use the panel on the left to find students, tick them, and add
                  them or apply a product.
                </p>
              </div>
            )}
            {orders.length > 0 && (
              <>
                <div className='space-y-2.5 md:hidden'>
                  <label className='flex cursor-pointer items-center gap-2 text-xs text-slate-500'>
                    <input
                      type='checkbox'
                      className='h-4 w-4 rounded border-slate-300 accent-brass'
                      checked={allTableSelected}
                      onChange={() =>
                        setTableSelected(
                          allTableSelected
                            ? new Set()
                            : new Set(filteredOrders.map((o) => o.student.id)),
                        )
                      }
                    />
                    Select all ({filteredOrders.length})
                  </label>
                  {filteredOrders.map((o) => (
                    <div
                      key={o.batchOrderId}
                      className='rounded-xl border border-slate-200 p-3 text-sm'
                    >
                      <div className='flex items-start gap-3'>
                        <input
                          type='checkbox'
                          className='mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-brass'
                          checked={tableSelected.has(o.student.id)}
                          onChange={() =>
                            setTableSelected((prev) =>
                              toggleInSet(prev, o.student.id),
                            )
                          }
                          aria-label={`Select ${o.student.fullName}`}
                        />
                        <div className='min-w-0 flex-1'>
                          <p className='font-medium text-ink'>
                            {o.student.fullName}
                          </p>
                          <p className='text-xs text-slate-400'>
                            {o.student.admissionNumber} · {o.student.className}
                          </p>
                          <p className='mt-1 break-words text-xs text-slate-500'>
                            {o.items.length === 0
                              ? 'No items yet'
                              : o.items
                                  .map(
                                    (i) => `${i.nameSnapshot} x${i.quantity}`,
                                  )
                                  .join(', ')}
                            {o.isCustom && (
                              <span className='ml-1 text-brass-700'>
                                (custom)
                              </span>
                            )}
                          </p>
                        </div>
                        <div className='shrink-0 text-right'>
                          <p className='font-mono text-sm text-ink'>
                            {formatCurrency(o.totalAmount)}
                          </p>
                          <p className='font-mono text-[11px] text-slate-400'>
                            Bal {formatCurrency(o.student.walletBalance)}
                          </p>
                        </div>
                      </div>
                      <div className='mt-2.5 flex items-center justify-between gap-2'>
                        <StatusBadge order={o} />
                        <div className='flex items-center gap-1.5'>
                          <button
                            onClick={() => openEditor(o)}
                            className='flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500'
                          >
                            <Pencil className='h-3.5 w-3.5' /> Edit
                          </button>
                          <button
                            onClick={() =>
                              removeMutation.mutate([o.student.id])
                            }
                            className='rounded-lg p-1.5 text-slate-400 hover:text-brick'
                            aria-label={`Remove ${o.student.fullName}`}
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className='hidden overflow-x-auto scrollbar-thin md:block'>
                  <table className='w-full text-left text-sm'>
                    <thead>
                      <tr className='border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400'>
                        <th className='w-8 px-2 py-2.5'>
                          <input
                            type='checkbox'
                            className='h-4 w-4 rounded border-slate-300 accent-brass'
                            checked={allTableSelected}
                            onChange={() =>
                              setTableSelected(
                                allTableSelected
                                  ? new Set()
                                  : new Set(
                                      filteredOrders.map((o) => o.student.id),
                                    ),
                              )
                            }
                            aria-label='Select all'
                          />
                        </th>
                        <th className='px-3 py-2.5 font-medium'>Student</th>
                        <th className='px-3 py-2.5 font-medium'>Items</th>
                        <th className='px-3 py-2.5 font-medium'>Total</th>
                        <th className='px-3 py-2.5 font-medium'>Balance</th>
                        <th className='px-3 py-2.5 font-medium'>Status</th>
                        <th className='px-3 py-2.5' />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => (
                        <tr
                          key={o.batchOrderId}
                          className='border-b border-slate-100 last:border-0 hover:bg-slate-50/60'
                        >
                          <td className='px-2 py-3'>
                            <input
                              type='checkbox'
                              className='h-4 w-4 rounded border-slate-300 accent-brass'
                              checked={tableSelected.has(o.student.id)}
                              onChange={() =>
                                setTableSelected((prev) =>
                                  toggleInSet(prev, o.student.id),
                                )
                              }
                              aria-label={`Select ${o.student.fullName}`}
                            />
                          </td>
                          <td className='px-3 py-3'>
                            <p className='font-medium text-ink'>
                              {o.student.fullName}
                            </p>
                            <p className='text-xs text-slate-400'>
                              {o.student.admissionNumber} ·{' '}
                              {o.student.className}
                            </p>
                          </td>
                          <td className='max-w-[16rem] px-3 py-3 text-xs text-slate-500'>
                            {o.items.length === 0
                              ? '-'
                              : o.items
                                  .map(
                                    (i) => `${i.nameSnapshot} x${i.quantity}`,
                                  )
                                  .join(', ')}
                            {o.isCustom && (
                              <span className='ml-1 text-brass-700'>
                                (custom)
                              </span>
                            )}
                          </td>
                          <td className='px-3 py-3 font-mono'>
                            {formatCurrency(o.totalAmount)}
                          </td>
                          <td className='px-3 py-3 font-mono text-slate-500'>
                            {formatCurrency(o.student.walletBalance)}
                          </td>
                          <td className='px-3 py-3'>
                            <StatusBadge order={o} />
                          </td>
                          <td className='px-3 py-3'>
                            <div className='flex items-center justify-end gap-1.5'>
                              <button
                                onClick={() => openEditor(o)}
                                className='flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brass hover:text-ink transition-colors'
                              >
                                <Pencil className='h-3.5 w-3.5' /> Edit
                              </button>
                              <button
                                onClick={() =>
                                  removeMutation.mutate([o.student.id])
                                }
                                className='rounded-lg p-1.5 text-slate-400 hover:bg-brick/10 hover:text-brick transition-colors'
                                aria-label={`Remove ${o.student.fullName}`}
                              >
                                <Trash2 className='h-4 w-4' />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <OrderEditorModal
        target={editorTarget}
        products={products ?? []}
        onClose={() => setEditorTarget(null)}
        isSaving={setOrderMutation.isPending}
        onSave={(studentId, payload) =>
          setOrderMutation.mutate({ studentId, payload })
        }
      />

      <Modal
        open={confirmOpen}
        onClose={() => !confirmMutation.isPending && setConfirmOpen(false)}
        title='Confirm this batch?'
        description='Please review before money moves.'
        className='max-w-lg'
      >
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='rounded-xl bg-slate-50 p-3'>
              <p className='text-xs text-slate-400'>Students</p>
              <p className='font-display text-lg text-ink'>
                {review?.studentCount ?? 0}
              </p>
            </div>
            <div className='rounded-xl bg-slate-50 p-3'>
              <p className='text-xs text-slate-400'>Batch total</p>
              <p className='font-display text-lg text-ink'>
                {formatCurrency(review?.grandTotal ?? 0)}
              </p>
            </div>
            <div className='rounded-xl bg-emerald/5 p-3'>
              <p className='text-xs text-slate-400'>Will be charged</p>
              <p className='font-display text-lg text-emerald'>
                {review?.readyCount ?? 0}
              </p>
            </div>
            <div
              className={cn(
                'rounded-xl p-3',
                (review?.insufficientCount ?? 0) > 0
                  ? 'bg-brick/5'
                  : 'bg-slate-50',
              )}
            >
              <p className='text-xs text-slate-400'>
                Will be skipped (insufficient)
              </p>
              <p
                className={cn(
                  'font-display text-lg',
                  (review?.insufficientCount ?? 0) > 0
                    ? 'text-brick'
                    : 'text-ink',
                )}
              >
                {review?.insufficientCount ?? 0}
              </p>
            </div>
          </div>

          {((review?.insufficientCount ?? 0) > 0 || emptyCount > 0) && (
            <div className='flex gap-2 rounded-xl border border-brass/30 bg-brass-50/50 p-3 text-xs text-brass-700'>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
              <p>
                {(review?.insufficientCount ?? 0) > 0 &&
                  `${review?.insufficientCount} student(s) don't have enough balance and will be skipped, with no partial deductions. `}
                {emptyCount > 0 &&
                  `${emptyCount} student(s) have no items and will be skipped. `}
                You can close this and fix them first, or continue and handle
                them from the results page.
              </p>
            </div>
          )}

          <p className='text-xs text-slate-400'>
            Each charged student is billed separately from their own wallet and
            the Seller is credited for each. This can&apos;t be undone from
            here.
          </p>

          <div className='flex justify-end gap-2'>
            <Button
              variant='ghost'
              onClick={() => setConfirmOpen(false)}
              disabled={confirmMutation.isPending}
            >
              Go back
            </Button>
            <Button
              isLoading={confirmMutation.isPending}
              disabled={(review?.readyCount ?? 0) === 0}
              onClick={() => confirmMutation.mutate()}
            >
              Confirm &amp; process
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title='Discard this draft?'
        description='No money has moved. The draft is simply cancelled.'
      >
        <div className='flex justify-end gap-2'>
          <Button variant='ghost' onClick={() => setDiscardOpen(false)}>
            Keep editing
          </Button>
          <Button
            variant='danger'
            isLoading={discardMutation.isPending}
            onClick={() => discardMutation.mutate()}
          >
            Discard draft
          </Button>
        </div>
      </Modal>
    </div>
  );
}
