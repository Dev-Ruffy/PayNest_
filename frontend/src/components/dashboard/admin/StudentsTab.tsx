'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { api, extractErrorMessage } from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { StudentSummary, PaginatedResult } from '@/types';
import toast from 'react-hot-toast';

export function StudentsTab() {
  const [search, setSearch] = useState('');
  const [pinModalStudent, setPinModalStudent] = useState<StudentSummary | null>(
    null,
  );
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [pinNotSet, setPinNotSet] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search],
    queryFn: async () =>
      (await api.get('/admin/students', { params: { search } })).data
        .data as PaginatedResult<StudentSummary>,
  });

  const viewPinMutation = useMutation({
    mutationFn: (studentId: string) =>
      api.get(`/admin/students/${studentId}/pin`),
    onSuccess: (res) => {
      if (res.data.data.hasPin) {
        setRevealedPin(res.data.data.pin);
        setPinNotSet(false);
      } else {
        setPinNotSet(true);
      }
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between gap-4'>
        <CardTitle>Students</CardTitle>
        <div className='relative w-56'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
          <Input
            placeholder='Search students…'
            className='pl-9'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={data?.items ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel='No students found.'
          columns={[
            { header: 'Name', accessor: (s) => s.fullName },
            {
              header: 'Admission No.',
              accessor: (s) => (
                <span className='font-mono text-xs'>{s.admissionNumber}</span>
              ),
            },
            { header: 'Class', accessor: (s) => s.className },
            {
              header: 'Balance',
              accessor: (s) => (
                <span className='font-mono'>
                  {formatCurrency(s.walletBalance)}
                </span>
              ),
            },
            {
              header: 'PIN',
              accessor: (s) => (
                <Badge tone={s.hasPin ? 'emerald' : 'gold'}>
                  {s.hasPin ? 'Set' : 'Not set yet'}
                </Badge>
              ),
            },
            {
              header: 'Status',
              accessor: (s) => (
                <Badge tone={s.isActive ? 'emerald' : 'slate'}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              header: '',
              accessor: (s) => (
                <button
                  onClick={() => {
                    setPinModalStudent(s);
                    setRevealedPin(null);
                    setPinNotSet(false);
                    viewPinMutation.mutate(s.id);
                  }}
                  className='flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brass hover:text-ink transition-colors'
                >
                  <Eye className='h-3.5 w-3.5' /> View PIN
                </button>
              ),
            },
          ]}
        />
      </CardContent>

      <Modal
        open={!!pinModalStudent}
        onClose={() => setPinModalStudent(null)}
        title={pinModalStudent?.fullName}
        description={
          pinNotSet ? undefined : 'This action is recorded in the audit log.'
        }
      >
        <div className='flex flex-col items-center py-4'>
          {viewPinMutation.isPending && (
            <p className='text-sm text-slate-400'>Decrypting…</p>
          )}
          {!viewPinMutation.isPending && pinNotSet && (
            <p className='max-w-xs text-center text-sm text-slate-500'>
              This student hasn&apos;t made their first tuck shop purchase yet,
              so no PIN has been created.
            </p>
          )}
          {revealedPin && (
            <p className='font-mono text-3xl tracking-[0.4em] text-ink'>
              {revealedPin}
            </p>
          )}
          <Button
            variant='ghost'
            className='mt-4'
            onClick={() => setPinModalStudent(null)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
