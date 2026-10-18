'use client';

import { useQuery } from '@tanstack/react-query';
import { School, User, Phone, Mail, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/axios';
import { formatDate } from '@/lib/utils';
import { StudentProfile } from '@/types';

export function ProfileTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-me'],
    queryFn: async () =>
      (await api.get('/student/me')).data.data as StudentProfile,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className='h-48 w-full' />
        ) : (
          <dl className='grid gap-5 sm:grid-cols-2'>
            {[
              { icon: User, label: 'Full name', value: data.fullName },
              {
                icon: GraduationCap,
                label: 'Admission number',
                value: data.admissionNumber,
              },
              { icon: GraduationCap, label: 'Class', value: data.className },
              { icon: School, label: 'School', value: data.school.name },
              {
                icon: User,
                label: 'Parent / guardian',
                value: data.parentName,
              },
              { icon: Phone, label: 'Parent phone', value: data.parentPhone },
              { icon: Mail, label: 'Parent email', value: data.parentEmail },
            ].map((row) => (
              <div key={row.label} className='flex items-start gap-3'>
                <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500'>
                  <row.icon className='h-4 w-4' />
                </div>
                <div>
                  <dt className='text-xs text-slate-400'>{row.label}</dt>
                  <dd className='text-sm font-medium text-ink'>{row.value}</dd>
                </div>
              </div>
            ))}
            <div className='flex items-start gap-3'>
              <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500'>
                <User className='h-4 w-4' />
              </div>
              <div>
                <dt className='text-xs text-slate-400'>Wallet created</dt>
                <dd className='text-sm font-medium text-ink'>
                  {formatDate(data.createdAt)}
                </dd>
              </div>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
