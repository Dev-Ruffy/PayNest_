'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/ui/Logo';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface DashboardShellProps {
  roleLabel: string;
  schoolName?: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
}

export function DashboardShell({
  roleLabel,
  schoolName,
  navItems,
  activeTab,
  onTabChange,
  children,
}: DashboardShellProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasBadge = navItems.some((item) => (item.badge ?? 0) > 0);

  const SidebarContent = (
    <div className='flex h-full flex-col'>
      <Link href='/' className='flex items-center gap-2 px-6 py-6'>
        <Logo size={32} />
        <span className='font-display text-lg font-medium text-parchment'>
          PayNest
        </span>
      </Link>

      <nav className='flex-1 space-y-1 px-3'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-parchment'
                  : 'text-slate-400 hover:bg-white/5 hover:text-parchment',
              )}
            >
              <Icon className='h-4 w-4' />
              {item.label}
              {item.badge ? (
                <span className='ml-auto rounded-full bg-brass px-2 py-0.5 text-[10px] font-semibold text-ink'>
                  {item.badge}
                </span>
              ) : (
                isActive && (
                  <span className='ml-auto h-1.5 w-1.5 rounded-full bg-brass' />
                )
              )}
            </button>
          );
        })}
      </nav>

      <div className='border-t border-white/10 p-4'>
        <div className='flex items-center gap-3 rounded-xl bg-white/5 p-3'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass text-sm font-semibold text-ink'>
            {initials(user?.fullName ?? roleLabel)}
          </div>
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium text-parchment'>
              {user?.fullName ?? roleLabel}
            </p>
            <p className='truncate text-xs text-slate-400'>{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className='mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-brick transition-colors'
        >
          <LogOut className='h-4 w-4' />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-parchment'>
      {/* Desktop sidebar */}
      <aside className='fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink-gradient lg:block'>
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-40 bg-ink/60 lg:hidden'
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className='fixed inset-y-0 left-0 z-50 w-72 bg-ink-gradient lg:hidden'
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className='min-w-0 lg:pl-64'>
        <header className='sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-parchment-paper/90 px-4 py-3 backdrop-blur sm:px-6 sm:py-4'>
          <div className='flex min-w-0 items-center gap-3'>
            <button
              onClick={() => setMobileOpen(true)}
              className='relative rounded-lg p-1.5 text-ink hover:bg-slate-100 lg:hidden'
              aria-label='Open menu'
            >
              <Menu className='h-5 w-5' />
              {hasBadge && (
                <span className='absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-brick' />
              )}
            </button>
            <div className='min-w-0'>
              <p className='truncate font-display text-base text-ink sm:text-lg'>
                {roleLabel} Dashboard
              </p>
              {schoolName && (
                <p className='truncate text-xs text-slate-400'>{schoolName}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className='hidden text-ink'
            aria-hidden
          >
            <X className='h-5 w-5' />
          </button>
        </header>

        <main className='min-w-0 p-4 sm:p-6'>{children}</main>
      </div>
    </div>
  );
}
