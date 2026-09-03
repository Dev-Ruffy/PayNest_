"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const ledgerRows = [
  { label: "Wallet top-up · Housemaster", amount: "+₦5,000", tone: "text-emerald" },
  { label: "Tuck Shop · Meat pie & Chapman", amount: "−₦850", tone: "text-brick" },
  { label: "Wallet top-up · Accountant", amount: "+₦2,000", tone: "text-emerald" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24">
      <div
        className="absolute inset-0 -z-10 bg-ink-gradient [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] lg:[clip-path:polygon(0_0,100%_0,100%_78%,0_100%)]"
      />
      <div className="absolute inset-0 -z-10 ledger-texture opacity-[0.03]" />

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl font-medium leading-[1.1] text-parchment sm:text-5xl lg:text-6xl">
            The tuck shop,
            <br />
            <span className="text-brass">without the cash box.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-200">
            PayNest gives every student a secure digital wallet — funded by parents through the Housemaster and
            Accountant, and spent safely at the tuck shop with a PIN. No lost cash. No chasing balances.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/signup/school">
              <Button variant="secondary" size="lg" className="group">
                Sign Up School
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/join-school">
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 bg-white/5 text-parchment hover:bg-white/10"
              >
                Join Existing School
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="glass-panel-dark rounded-xl2 p-6 shadow-cardHover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-300">PayNest Wallet</p>
                <p className="font-mono text-2xl text-parchment">₦8,150.00</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass text-ink font-display">
                E
              </div>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-400">Emeka Johnson · BF-0001</p>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
              {ledgerRows.map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-300">{row.label}</span>
                  <span className={`font-mono ${row.tone}`}>{row.amount}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="absolute -right-6 -top-6 -z-10 h-full w-full rounded-xl2 border border-brass/20" />
        </motion.div>
      </div>
    </section>
  );
}
