'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table } from '@/components/ui/Table';
import { api } from '@/lib/axios';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SellerBalanceSummary, DailyBalanceEntry } from '@/types';

export function SellerBalanceCard() {
  const [showTotal, setShowTotal] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['seller-wallet'],
    queryFn: async () =>
      (await api.get('/seller/wallet')).data.data as SellerBalanceSummary,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['seller-balance-history'],
    queryFn: async () =>
      (await api.get('/seller/balance-history')).data
        .data as DailyBalanceEntry[],
    enabled: historyOpen,
  });

  if (isLoading || !summary) {
    return <Skeleton className='h-32 w-full max-w-sm' />;
  }

  return (
    <>
      <Card className='max-w-sm overflow-hidden bg-ink-gradient text-parchment'>
        <CardContent className='py-6'>
          <div className='flex items-center gap-2 text-slate-300'>
            <TrendingUp className='h-4 w-4' />
            <span className='text-xs uppercase tracking-wide'>
              {showTotal ? 'Total balance' : "Today's profit"}
            </span>
          </div>
          <p className='mt-2 font-mono text-3xl'>
            {formatCurrency(
              showTotal ? summary.totalBalance : summary.dailyProfit,
            )}
          </p>
          {!showTotal && (
            <p className='mt-1 text-xs text-slate-400'>
              {summary.dailySaleCount} sale
              {summary.dailySaleCount === 1 ? '' : 's'} today
            </p>
          )}

          <div className='mt-5 flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='outline'
              className='border-white/20 bg-white/5 text-parchment hover:bg-white/10'
              onClick={() => setShowTotal((s) => !s)}
            >
              <Wallet className='h-3.5 w-3.5' />{' '}
              {showTotal ? "Show today's profit" : 'View total balance'}
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='border-white/20 bg-white/5 text-parchment hover:bg-white/10'
              onClick={() => setHistoryOpen(true)}
            >
              <History className='h-3.5 w-3.5' /> Daily history
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title='Daily balance history'
        description='Your last 30 days of sales, day by day.'
      >
        <Table
          isLoading={historyLoading}
          data={history ?? []}
          keyExtractor={(row) => row.date}
          emptyLabel='No sales recorded yet.'
          columns={[
            { header: 'Date', accessor: (d) => formatDate(d.date) },
            { header: 'Sales', accessor: (d) => d.count },
            {
              header: 'Total',
              accessor: (d) => (
                <span className='font-mono'>{formatCurrency(d.total)}</span>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
}
