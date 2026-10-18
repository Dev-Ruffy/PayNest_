'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Gauge, CalendarClock } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { HelpGuide } from '@/components/ui/HelpGuide';
import { api, extractErrorMessage } from '@/lib/axios';
import { formatDate } from '@/lib/utils';

interface LimitSettings {
  creditPeriodType: 'TERM' | 'SESSION' | null;
  creditPeriodMaxAmount: string | number | null;
  currentPeriodStartedAt: string | null;
  dailySpendMaxAmount: string | number | null;
}

const asInput = (v: string | number | null | undefined) =>
  v === null || v === undefined ? '' : String(Number(v));

export function CreditLimitsCard() {
  const queryClient = useQueryClient();
  const [periodType, setPeriodType] = useState('');
  const [periodMax, setPeriodMax] = useState('');
  const [dailyMax, setDailyMax] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () =>
      (await api.get('/admin/settings')).data.data as LimitSettings,
  });

  useEffect(() => {
    if (!data) return;
    setPeriodType(data.creditPeriodType ?? '');
    setPeriodMax(asInput(data.creditPeriodMaxAmount));
    setDailyMax(asInput(data.dailySpendMaxAmount));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put('/admin/credit-limits', {
        creditPeriodType: periodType || null,
        creditPeriodMaxAmount: periodMax ? Number(periodMax) : null,
        dailySpendMaxAmount: dailyMax ? Number(dailyMax) : null,
      }),
    onSuccess: () => {
      toast.success('Limits saved.');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post('/admin/reset-period'),
    onSuccess: () => {
      toast.success('New period started.');
      setResetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const save = () => {
    if (!!periodType !== !!periodMax) {
      toast.error('Choose both a period and a maximum amount, or clear both.');
      return;
    }
    saveMutation.mutate();
  };

  const hasPeriodLimit = !!data?.creditPeriodMaxAmount;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Gauge className='h-4 w-4 text-brass-700' />
          <CardTitle>Student spending limits</CardTitle>
          <HelpGuide title='How spending limits work'>
            <p>
              These optional limits apply to every student at your school. Leave
              a field blank for no limit.
            </p>
            <ul>
              <li>
                <strong>Credit limit per term or session:</strong> the most a
                student&apos;s wallet can be topped up with, in total, during
                the current term or session. Crediting past it is blocked.
              </li>
              <li>
                <strong>Daily spending limit:</strong> the most a student can
                spend in a single day, across both individual purchases and bulk
                orders.
              </li>
              <li>
                <strong>Starting a new term or session:</strong> when a new one
                begins, click <strong>Start new period</strong> so credit totals
                count from that day.
              </li>
            </ul>
          </HelpGuide>
        </div>
        <CardDescription>
          Optional caps on what a student can be credited and can spend.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-3 sm:grid-cols-3'>
          <div>
            <Label>Credit limit resets every</Label>
            <Select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
            >
              <option value=''>No limit</option>
              <option value='TERM'>Term</option>
              <option value='SESSION'>Session</option>
            </Select>
          </div>
          <div>
            <Label>Maximum credit per period</Label>
            <Input
              type='number'
              step='0.01'
              value={periodMax}
              onChange={(e) => setPeriodMax(e.target.value)}
              placeholder='No limit'
            />
          </div>
          <div>
            <Label>Maximum spend per day</Label>
            <Input
              type='number'
              step='0.01'
              value={dailyMax}
              onChange={(e) => setDailyMax(e.target.value)}
              placeholder='No limit'
            />
          </div>
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3'>
          {hasPeriodLimit ? (
            <div className='flex items-center gap-2 text-xs text-slate-500'>
              <CalendarClock className='h-4 w-4' />
              Current{' '}
              {data?.creditPeriodType === 'SESSION' ? 'session' : 'term'}{' '}
              started{' '}
              {data?.currentPeriodStartedAt
                ? formatDate(data.currentPeriodStartedAt)
                : '-'}
              <button
                onClick={() => setResetOpen(true)}
                className='ml-1 font-medium text-ink underline underline-offset-2'
              >
                Start new period
              </button>
            </div>
          ) : (
            <span />
          )}
          <Button size='sm' isLoading={saveMutation.isPending} onClick={save}>
            Save limits
          </Button>
        </div>
      </CardContent>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title='Start a new term/session?'
        description="Credit totals will count from today. Students' wallet balances are not changed."
      >
        <div className='flex justify-end gap-2'>
          <Button variant='ghost' onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            isLoading={resetMutation.isPending}
            onClick={() => resetMutation.mutate()}
          >
            Start new period
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
