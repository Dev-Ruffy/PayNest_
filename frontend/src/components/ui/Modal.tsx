'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-ink/50 backdrop-blur-sm'
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl2 bg-white p-5 shadow-cardHover scrollbar-thin sm:p-6',
              className,
            )}
          >
            <div className='mb-4 flex items-start justify-between gap-4'>
              <div className='min-w-0'>
                {title && (
                  <h3 className='font-display text-lg text-ink sm:text-xl'>
                    {title}
                  </h3>
                )}
                {description && (
                  <p className='mt-1 text-sm text-slate-400'>{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-ink transition-colors'
                aria-label='Close'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
