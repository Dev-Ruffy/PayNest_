'use client';

import { useState, ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal } from './Modal';

export function HelpGuide({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className='flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-brass hover:text-brass-700 transition-colors'
        aria-label='How this works'
        title='How this works'
      >
        <HelpCircle className='h-4 w-4' />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        className='max-w-lg'
      >
        <div className='space-y-3 text-sm text-slate-600 [&_strong]:text-ink [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5'>
          {children}
        </div>
      </Modal>
    </>
  );
}
