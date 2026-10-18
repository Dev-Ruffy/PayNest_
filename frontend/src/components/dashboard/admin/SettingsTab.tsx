'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { KeyRound, Copy, Sparkles, Eye, EyeOff } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, extractErrorMessage } from '@/lib/axios';
import { formatDate } from '@/lib/utils';
import {
  changeHousemasterPasswordSchema,
  ChangeHousemasterPasswordInput,
} from '@/lib/validation';
import { CreditLimitsCard } from './CreditLimitsCard';

interface SchoolSettings {
  id: string;
  name: string;
  email: string;
  status: string;
  registrantName: string;
  registrantDesignation: string;
  createdAt: string;
}

/** Client-side convenience suggestion only - the admin can freely edit or replace it before saving. */
function suggestPassword(): string {
  const words = [
    'harbor',
    'willow',
    'meadow',
    'amber',
    'crest',
    'cedar',
    'orbit',
    'quartz',
    'ledger',
    'maple',
  ];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `house-${word}-${num}`;
}

export function SettingsTab() {
  const [showPassword, setShowPassword] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () =>
      (await api.get('/admin/settings')).data.data as SchoolSettings,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ChangeHousemasterPasswordInput>({
    resolver: zodResolver(changeHousemasterPasswordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangeHousemasterPasswordInput) =>
      api.put('/admin/housemaster-password', data),
    onSuccess: (res, variables) => {
      setLastSaved(variables.newPassword);
      reset();
      toast.success('Shared Housemaster password updated.');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div className='grid gap-5 lg:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>School profile</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <Skeleton className='h-32 w-full' />
          ) : (
            <dl className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <dt className='text-slate-400'>School name</dt>
                <dd className='font-medium text-ink'>{data.name}</dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-slate-400'>School email</dt>
                <dd>{data.email}</dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-slate-400'>Principal</dt>
                <dd>{data.registrantName}</dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-slate-400'>Designation</dt>
                <dd>{data.registrantDesignation}</dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-slate-400'>Member since</dt>
                <dd>{formatDate(data.createdAt)}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <KeyRound className='h-4 w-4 text-brass-700' />
            <CardTitle>Housemaster shared password</CardTitle>
          </div>
          <CardDescription>
            Set this yourself, then share it with every Housemaster. Saving it
            immediately invalidates the old one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((data) =>
              changePasswordMutation.mutate(data),
            )}
            className='space-y-3'
          >
            <div className='relative'>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder='Choose a new shared password'
                className='pr-10 font-mono'
                {...register('newPassword')}
                error={errors.newPassword?.message}
              />
              <button
                type='button'
                onClick={() => setShowPassword((s) => !s)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink transition-colors'
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </button>
            </div>

            <button
              type='button'
              onClick={() => {
                setValue('newPassword', suggestPassword(), {
                  shouldValidate: true,
                });
                setShowPassword(true);
              }}
              className='flex items-center gap-1.5 text-xs font-medium text-brass-700 hover:text-brass-600 transition-colors'
            >
              <Sparkles className='h-3.5 w-3.5' /> Suggest one for me
            </button>

            <Button
              type='submit'
              className='w-full'
              isLoading={changePasswordMutation.isPending}
            >
              Save new password
            </Button>
          </form>

          {lastSaved && (
            <div className='mt-4 rounded-xl border border-brass/30 bg-brass-50 p-4'>
              <p className='text-xs text-brass-700'>
                Now active - share this with your Housemasters:
              </p>
              <div className='mt-2 flex items-center justify-between gap-2'>
                <p className='font-mono text-lg text-ink'>{lastSaved}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(lastSaved);
                    toast.success('Copied to clipboard.');
                  }}
                  className='rounded-lg p-2 text-brass-700 hover:bg-brass-100 transition-colors'
                >
                  <Copy className='h-4 w-4' />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className='lg:col-span-2'>
        <CreditLimitsCard />
      </div>
    </div>
  );
}
