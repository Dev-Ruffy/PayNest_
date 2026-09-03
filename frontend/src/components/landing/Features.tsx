"use client";

import { motion } from "framer-motion";
import { Wallet, Users, ReceiptText, KeyRound, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Real digital wallets",
    description: "Every student gets a wallet with a live balance — funded through Housemasters and the Accountant, never touched by cash.",
  },
  {
    icon: KeyRound,
    title: "PIN-protected purchases",
    description: "Tuck shop purchases require the student's PIN, so no one can spend a balance that isn't theirs.",
  },
  {
    icon: Users,
    title: "Six purpose-built roles",
    description: "Developer, Admin, Accountant, Housemaster, Student and Seller each see only what their job requires.",
  },
  {
    icon: ReceiptText,
    title: "Every transaction, logged",
    description: "Deposits and purchases generate an immutable ledger entry — who did it, when, and for how much.",
  },
  {
    icon: BarChart3,
    title: "One dashboard per school",
    description: "Principals see balances, approvals and activity across the whole school in a single view.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-parchment-paper py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brass-700">Features</span>
          <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Everything a school wallet needs.</h2>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-brass">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
