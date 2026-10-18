'use client';

import {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  forwardRef,
  SelectHTMLAttributes,
  useState,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className='w-full'>
        <div className='relative'>
          <input
            ref={ref}
            type={isPassword && visible ? 'text' : type}
            className={cn(
              'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 outline-none transition-colors',
              'focus:border-brass focus:ring-2 focus:ring-brass/20',
              error ? 'border-brick' : 'border-slate-200',
              isPassword && 'pr-11',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type='button'
              onClick={() => setVisible((v) => !v)}
              className='absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-400 transition-colors hover:text-ink'
              aria-label={visible ? 'Hide password' : 'Show password'}
              title={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? (
                <EyeOff className='h-4 w-4' />
              ) : (
                <Eye className='h-4 w-4' />
              )}
            </button>
          )}
        </div>
        {error && <p className='mt-1.5 text-xs text-brick'>{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-ink', className)}
      {...props}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className='w-full'>
      <select
        ref={ref}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors appearance-none',
          'focus:border-brass focus:ring-2 focus:ring-brass/20',
          error ? 'border-brick' : 'border-slate-200',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className='mt-1.5 text-xs text-brick'>{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';
