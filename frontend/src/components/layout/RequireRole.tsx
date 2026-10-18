'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { role: currentRole, isHydrating } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrating && currentRole !== role) {
      router.replace('/');
    }
  }, [isHydrating, currentRole, role, router]);

  if (isHydrating || currentRole !== role) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-parchment'>
        <Loader2 className='h-6 w-6 animate-spin text-brass' />
      </div>
    );
  }

  return <>{children}</>;
}
