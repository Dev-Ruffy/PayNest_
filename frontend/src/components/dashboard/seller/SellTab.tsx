'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Search, CheckCircle2, Printer, Sparkles } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, extractErrorMessage } from '@/lib/axios';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  purchaseSchema,
  PurchaseInput,
  firstPurchaseSchema,
  FirstPurchaseInput,
} from '@/lib/validation';
import { StudentSummary, PaginatedResult } from '@/types';
import { SellerBalanceCard } from './BalanceCard';

interface Receipt {
  reference: string;
  studentName: string;
  admissionNumber: string;
  amount: number;
  items: string[];
  remainingBalance: string | number;
  timestamp: string;
  isFirstPurchase: boolean;
}

export function SellTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(
    null,
  );
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const { data: students, isLoading: searchLoading } = useQuery({
    queryKey: ['seller-students', search],
    queryFn: async () =>
      (await api.get('/seller/students', { params: { search } })).data
        .data as PaginatedResult<StudentSummary>,
    enabled: search.length > 0,
  });

  // Returning student - they already know their PIN.
  const returningForm = useForm<PurchaseInput>({
    resolver: zodResolver(purchaseSchema),
  });
  // First-ever purchase - the PIN typed here becomes their permanent PIN, so we ask them to confirm it.
  const firstForm = useForm<FirstPurchaseInput>({
    resolver: zodResolver(firstPurchaseSchema),
  });

  const invalidateAfterSale = () => {
    queryClient.invalidateQueries({ queryKey: ['seller-wallet'] });
    queryClient.invalidateQueries({ queryKey: ['seller-balance-history'] });
    queryClient.invalidateQueries({ queryKey: ['seller-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['seller-students'] });
  };

  const purchaseMutation = useMutation({
    mutationFn: (data: { items: string; amount: number; pin: string }) =>
      api.post('/seller/purchase', {
        studentId: selectedStudent!.id,
        items: data.items
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean),
        amount: data.amount,
        pin: data.pin,
      }),
    onSuccess: (res) => {
      setReceipt(res.data.data.receipt);
      setSelectedStudent(null);
      returningForm.reset();
      firstForm.reset();
      invalidateAfterSale();
    },
    onError: (err) => toast.error(extractErrorMessage(err, 'Purchase failed.')),
  });

  return (
    <div className='space-y-5'>
      <SellerBalanceCard />

      <Card>
        <CardHeader>
          <CardTitle>New sale</CardTitle>
          <CardDescription>
            Search for the student, then confirm the purchase with their PIN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='relative mb-4 max-w-sm'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
            <Input
              placeholder='Search by name, admission no. or class…'
              className='pl-9'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedStudent(null);
              }}
            />
          </div>

          {search && !selectedStudent && (
            <div className='max-h-56 space-y-2 overflow-y-auto scrollbar-thin'>
              {searchLoading && <Skeleton className='h-12 w-full' />}
              {!searchLoading && (students?.items.length ?? 0) === 0 && (
                <p className='py-4 text-center text-sm text-slate-400'>
                  No students match your search.
                </p>
              )}
              {students?.items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className='flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left hover:border-brass hover:bg-brass-50/40 transition-colors'
                >
                  <div>
                    <p className='text-sm font-medium text-ink'>{s.fullName}</p>
                    <p className='text-xs text-slate-400'>
                      {s.admissionNumber} · {s.className}
                    </p>
                  </div>
                  <span className='font-mono text-sm text-slate-500'>
                    {formatCurrency(s.walletBalance)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedStudent && !selectedStudent.hasPin && (
            <form
              onSubmit={firstForm.handleSubmit((data) =>
                purchaseMutation.mutate(data),
              )}
              className='mt-2 max-w-sm space-y-3 rounded-xl border border-brass/30 bg-brass-50/30 p-4'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-ink'>
                    {selectedStudent.fullName}
                  </p>
                  <p className='text-xs text-slate-400'>
                    Balance: {formatCurrency(selectedStudent.walletBalance)}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setSelectedStudent(null)}
                  className='text-xs text-slate-400 underline'
                >
                  Change
                </button>
              </div>

              <div className='flex items-start gap-2 rounded-lg bg-brass-100/60 p-2.5 text-xs text-brass-700'>
                <Sparkles className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                <span>
                  This is {selectedStudent.fullName.split(' ')[0]}&apos;s first
                  purchase - have them choose a PIN now. They&apos;ll use it for
                  every purchase and login from here on, so ask them to remember
                  it.
                </span>
              </div>

              <div>
                <Label>Items purchased (comma separated)</Label>
                <Input
                  placeholder='Meat pie, Chapman'
                  {...firstForm.register('items')}
                  error={firstForm.formState.errors.items?.message}
                />
              </div>
              <div>
                <Label>Total amount</Label>
                <Input
                  type='number'
                  step='0.01'
                  placeholder='850'
                  {...firstForm.register('amount')}
                  error={firstForm.formState.errors.amount?.message}
                />
              </div>
              <div>
                <Label>Choose a 4–6 digit PIN</Label>
                <Input
                  type='password'
                  inputMode='numeric'
                  placeholder='••••'
                  {...firstForm.register('pin')}
                  error={firstForm.formState.errors.pin?.message}
                />
              </div>
              <div>
                <Label>Confirm PIN</Label>
                <Input
                  type='password'
                  inputMode='numeric'
                  placeholder='••••'
                  {...firstForm.register('confirmPin')}
                  error={firstForm.formState.errors.confirmPin?.message}
                />
              </div>
              <Button
                type='submit'
                className='w-full'
                isLoading={purchaseMutation.isPending}
              >
                Set PIN &amp; complete purchase
              </Button>
            </form>
          )}

          {selectedStudent && selectedStudent.hasPin && (
            <form
              onSubmit={returningForm.handleSubmit((data) =>
                purchaseMutation.mutate(data),
              )}
              className='mt-2 max-w-sm space-y-3 rounded-xl border border-brass/30 bg-brass-50/30 p-4'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-ink'>
                    {selectedStudent.fullName}
                  </p>
                  <p className='text-xs text-slate-400'>
                    Balance: {formatCurrency(selectedStudent.walletBalance)}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setSelectedStudent(null)}
                  className='text-xs text-slate-400 underline'
                >
                  Change
                </button>
              </div>
              <div>
                <Label>Items purchased (comma separated)</Label>
                <Input
                  placeholder='Meat pie, Chapman'
                  {...returningForm.register('items')}
                  error={returningForm.formState.errors.items?.message}
                />
              </div>
              <div>
                <Label>Total amount</Label>
                <Input
                  type='number'
                  step='0.01'
                  placeholder='850'
                  {...returningForm.register('amount')}
                  error={returningForm.formState.errors.amount?.message}
                />
              </div>
              <div>
                <Label>Student PIN</Label>
                <Input
                  type='password'
                  inputMode='numeric'
                  placeholder='••••'
                  {...returningForm.register('pin')}
                  error={returningForm.formState.errors.pin?.message}
                />
              </div>
              <Button
                type='submit'
                className='w-full'
                isLoading={purchaseMutation.isPending}
              >
                Confirm purchase
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title={
          receipt?.isFirstPurchase
            ? 'PIN created & purchase complete'
            : 'Purchase complete'
        }
        description={receipt?.reference}
      >
        {receipt && (
          <div className='space-y-4'>
            <div className='flex flex-col items-center py-2 text-center'>
              <CheckCircle2 className='h-10 w-10 text-emerald' />
              {receipt.isFirstPurchase && (
                <p className='mt-2 text-xs text-brass-700'>
                  Remind the student to remember their new PIN - it&apos;s now
                  their login PIN too.
                </p>
              )}
            </div>
            <div className='rounded-xl border border-slate-200 p-4 text-sm'>
              <div className='flex justify-between py-1'>
                <span className='text-slate-400'>Student</span>
                <span>
                  {receipt.studentName} ({receipt.admissionNumber})
                </span>
              </div>
              <div className='flex justify-between py-1'>
                <span className='text-slate-400'>Items</span>
                <span className='text-right'>{receipt.items.join(', ')}</span>
              </div>
              <div className='flex justify-between py-1'>
                <span className='text-slate-400'>Amount</span>
                <span className='font-mono'>
                  {formatCurrency(receipt.amount)}
                </span>
              </div>
              <div className='flex justify-between py-1'>
                <span className='text-slate-400'>New balance</span>
                <span className='font-mono'>
                  {formatCurrency(receipt.remainingBalance)}
                </span>
              </div>
              <div className='flex justify-between py-1'>
                <span className='text-slate-400'>Time</span>
                <span>{formatDate(receipt.timestamp)}</span>
              </div>
            </div>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => window.print()}
            >
              <Printer className='h-4 w-4' /> Print receipt
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
