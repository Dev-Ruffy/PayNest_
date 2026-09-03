"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { LogOut, Menu, X, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui/Logo";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardShellProps {
  roleLabel: string;
  schoolName?: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
}

export function DashboardShell({ roleLabel, schoolName, navItems, activeTab, onTabChange, children }: DashboardShellProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-6 py-6">
        <Logo size={32} />
        <span className="font-display text-lg font-medium text-parchment">PayNest</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
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
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white/10 text-parchment" : "text-slate-400 hover:bg-white/5 hover:text-parchment"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brass" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass text-sm font-semibold text-ink">
            {initials(user?.fullName ?? roleLabel)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-parchment">{user?.fullName ?? roleLabel}</p>
            <p className="truncate text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-brick transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-parchment">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink-gradient lg:block">{SidebarContent}</aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-ink-gradient lg:hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-parchment-paper/90 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-ink hover:bg-slate-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="font-display text-lg text-ink">{roleLabel} Dashboard</p>
              {schoolName && <p className="text-xs text-slate-400">{schoolName}</p>}
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="hidden text-ink" aria-hidden>
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
