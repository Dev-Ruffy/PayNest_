'use client';

import { motion } from 'framer-motion';
import {
  Wallet,
  Users,
  ReceiptText,
  KeyRound,
  BarChart3,
  Layers,
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Real digital wallets',
    description:
      'Every student gets a wallet with a live balance, funded by the Accountant or Housemaster whether parents pay in cash or by bank transfer.',
  },
  {
    icon: KeyRound,
    title: 'PIN-protected purchases',
    description:
      "Tuck shop purchases require the student's PIN, so no one can spend a balance that isn't theirs.",
  },
  {
    icon: Layers,
    title: 'Bulk orders for whole groups',
    description:
      "Housemasters can order for dozens of students at once from the Seller's price list. Totals are calculated automatically and each student is charged separately.",
  },
  {
    icon: Users,
    title: 'Six purpose-built roles',
    description:
      'Developer, Admin, Accountant, Housemaster, Student and Seller each see only what their job requires.',
  },
  {
    icon: ReceiptText,
    title: 'Every transaction, logged',
    description:
      'Deposits, purchases and bulk orders each get their own ledger entry showing the student, what was bought, who recorded it, when, and for how much.',
  },
  {
    icon: BarChart3,
    title: 'One dashboard per school',
    description:
      'Principals see balances, approvals and activity across the whole school, and can set optional spending limits for students.',
  },
];

export function Features() {
  return (
    <section id='features' className='bg-parchment-paper py-16 sm:py-24'>
      <div className='mx-auto max-w-6xl px-5 sm:px-6'>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='max-w-xl'
        >
          <span className='text-xs font-semibold uppercase tracking-widest text-brass-700'>
            Features
          </span>
          <h2 className='mt-3 font-display text-2xl text-ink sm:text-4xl'>
            Everything a school wallet needs.
          </h2>
        </motion.div>

        <div className='mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3'>
          {features.map((f) => (
            <div
              key={f.title}
              className='rounded-xl2 border border-slate-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardHover sm:p-6'
            >
              <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-brass'>
                <f.icon className='h-5 w-5' />
              </div>
              <h3 className='mt-4 font-display text-base text-ink sm:text-lg'>
                {f.title}
              </h3>
              <p className='mt-2 text-sm text-slate-500'>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
