'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { api } from '@/lib/axios';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DailyBalanceEntry } from '@/types';

export function SellerBalanceTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['accountant-seller-balance-history'],
    queryFn: async () =>
      (await api.get('/accountant/seller-balance-history')).data.data as {
        sellerName: string;
        history: DailyBalanceEntry[];
      },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Seller daily balances{data?.sellerName ? ` - ${data.sellerName}` : ''}
        </CardTitle>
        <CardDescription>
          Day-by-day tuck shop sales, for oversight.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={data?.history ?? []}
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
      </CardContent>
    </Card>
  );
}
