'use client';

import { motion } from 'framer-motion';

export function About() {
  return (
    <section
      id='about'
      className='mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24'
    >
      <div className='grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center'>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className='text-xs font-semibold uppercase tracking-widest text-brass-700'>
            About PayNest
          </span>
          <h2 className='mt-3 font-display text-3xl text-ink sm:text-4xl'>
            A bank account, sized for school life.
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className='space-y-4 text-slate-600'
        >
          <p>
            Boarding schools have run on the same fragile system for decades:
            students carry cash, Housemasters hold onto it for safekeeping, and
            the tuck shop deals in loose change and IOUs. Money goes missing.
            Balances live in someone&apos;s notebook.
          </p>
          <p>
            PayNest replaces that notebook with a real ledger. Parents keep
            paying the way they already do, by cash or bank transfer, and the
            school credits each student&apos;s wallet. Every school gets its own
            PayNest instance, with Principals, Accountants, Housemasters,
            Students and the Tuck Shop Seller each working from a dashboard
            built for exactly their job, nothing more and nothing less.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
