import { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function AuthLayout({
  title,
  subtitle,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-gradient px-4 py-16'>
      <div className='absolute inset-0 ledger-texture opacity-[0.04]' />
      <div className={`relative z-10 w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
        <Link href='/' className='mb-8 flex items-center justify-center gap-2'>
          <Logo size={36} />
          <span className='font-display text-xl font-medium text-parchment'>
            PayNest
          </span>
        </Link>
        <div className='rounded-xl2 bg-parchment-paper p-6 shadow-cardHover sm:p-8'>
          <h1 className='font-display text-2xl text-ink'>{title}</h1>
          {subtitle && (
            <p className='mt-1.5 text-sm text-slate-500'>{subtitle}</p>
          )}
          <div className='mt-6'>{children}</div>
        </div>
      </div>
    </div>
  );
}
