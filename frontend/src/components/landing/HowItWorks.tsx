"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Parent hands cash to the Housemaster",
    description: "Instead of the student carrying cash around school, it's handed to their Housemaster or Housemistress for safekeeping.",
  },
  {
    n: "02",
    title: "Housemaster passes it to the Accountant",
    description: "The Housemaster delivers the cash to the school Accountant, who is responsible for the school's PayNest float.",
  },
  {
    n: "03",
    title: "The student's wallet is credited",
    description: "The Accountant (or the Housemaster directly) credits the exact amount to the student's PayNest wallet — instantly reflected on their dashboard.",
  },
  {
    n: "04",
    title: "Student spends at the tuck shop",
    description: "At the tuck shop, the Seller rings up the items and the student enters their PIN to confirm — no cash changes hands.",
  },
  {
    n: "05",
    title: "Seller is settled automatically",
    description: "The moment a purchase is confirmed, the amount moves from the student's wallet straight into the Seller's PayNest balance.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-xl"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-brass-700">How it works</span>
        <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">From cash in hand to a settled receipt.</h2>
      </motion.div>

      <div className="relative mt-14">
        <div className="absolute left-6 top-2 bottom-2 hidden w-px bg-slate-200 sm:block" />
        <div className="space-y-10">
          {steps.map((step) => (
            <div key={step.n} className="relative flex gap-6 sm:pl-2">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm text-brass">
                {step.n}
              </div>
              <div className="pt-1.5">
                <h3 className="font-display text-lg text-ink">{step.title}</h3>
                <p className="mt-1.5 max-w-xl text-sm text-slate-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
