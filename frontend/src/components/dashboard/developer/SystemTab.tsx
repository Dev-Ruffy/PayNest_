'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Database, CloudUpload } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/axios';

interface Health {
  status: string;
  uptimeSeconds: number;
  database: string;
  timestamp: string;
}
interface DbOverview {
  schools: number;
  users: number;
  students: number;
  transactions: number;
  auditLogs: number;
  activeRefreshTokens: number;
}
interface StorageOverview {
  provider: string;
  configured: boolean;
  status: string;
}

export function SystemTab() {
  const { data: health, isLoading: l1 } = useQuery({
    queryKey: ['developer-health'],
    queryFn: async () =>
      (await api.get('/developer/health')).data.data as Health,
    refetchInterval: 15000,
  });
  const { data: db, isLoading: l2 } = useQuery({
    queryKey: ['developer-db-overview'],
    queryFn: async () =>
      (await api.get('/developer/database-overview')).data.data as DbOverview,
  });
  const { data: storage, isLoading: l3 } = useQuery({
    queryKey: ['developer-storage-overview'],
    queryFn: async () =>
      (await api.get('/developer/storage-overview')).data
        .data as StorageOverview,
  });

  return (
    <div className='grid gap-5 lg:grid-cols-3'>
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Activity className='h-4 w-4 text-emerald' />
            <CardTitle>API health</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {l1 || !health ? (
            <Skeleton className='h-24 w-full' />
          ) : (
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Status</span>
                <Badge tone={health.status === 'healthy' ? 'emerald' : 'brick'}>
                  {health.status}
                </Badge>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Database</span>
                <span>{health.database}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Uptime</span>
                <span className='font-mono'>
                  {Math.floor(health.uptimeSeconds / 60)}m
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Database className='h-4 w-4 text-brass-700' />
            <CardTitle>Database overview</CardTitle>
          </div>
          <CardDescription>Row counts across core tables</CardDescription>
        </CardHeader>
        <CardContent>
          {l2 || !db ? (
            <Skeleton className='h-32 w-full' />
          ) : (
            <div className='grid grid-cols-2 gap-y-2 text-sm'>
              {Object.entries(db).map(([key, value]) => (
                <div key={key} className='flex flex-col'>
                  <span className='text-xs text-slate-400 capitalize'>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className='font-mono text-ink'>{value}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <CloudUpload className='h-4 w-4 text-slate-600' />
            <CardTitle>Storage</CardTitle>
          </div>
          <CardDescription>Cloudinary - future-ready</CardDescription>
        </CardHeader>
        <CardContent>
          {l3 || !storage ? (
            <Skeleton className='h-16 w-full' />
          ) : (
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Provider</span>
                <span>{storage.provider}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Status</span>
                <Badge tone={storage.configured ? 'emerald' : 'slate'}>
                  {storage.configured ? 'Connected' : 'Not configured'}
                </Badge>
              </div>
              <p className='text-xs text-slate-400'>{storage.status}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
