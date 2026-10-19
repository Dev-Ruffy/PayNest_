"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Parents pay the school",
    description:
      "Parents pay in whichever way your school uses: cash handed to the Housemaster, or a bank transfer to the school's account.",
  },
  {
    n: "02",
    title: "The school confirms the payment",
    description:
      "A Housemaster passes any cash to the Accountant, or the Accountant confirms the transfer in the school's account. Either way, the school holds the money and PayNest keeps the record.",
  },
  {
    n: "03",
    title: "The student's wallet is credited",
    description:
      "The Accountant (or the Housemaster directly) credits the exact amount to the student's PayNest wallet, instantly reflected on their dashboard.",
  },
  {
    n: "04",
    title: "Students spend at the tuck shop",
    description:
      "The Seller rings up the items and the student enters their PIN to confirm. Their first purchase sets the PIN. No cash changes hands.",
  },
  {
    n: "05",
    title: "Or the Housemaster orders for a group",
    description:
      "For younger students and large groups, the Housemaster builds a bulk order: pick the students, choose products from the Seller's price list, and confirm. No PIN or device is needed, and every total is calculated automatically.",
  },
  {
    n: "06",
    title: "The Seller is settled automatically",
    description:
      "The moment a purchase or bulk order is confirmed, each student is charged from their own wallet and the amount moves straight into the Seller's PayNest balance, with a separate record for every student.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-xl"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-brass-700">How it works</span>
        <h2 className="mt-3 font-display text-2xl text-ink sm:text-4xl">From payment to a settled receipt.</h2>
        <p className="mt-3 text-sm text-slate-500 sm:text-base">
          Whether parents pay in cash or by bank transfer, everything after the school confirms the payment works the same way.
        </p>
      </motion.div>

      <div className="relative mt-10 sm:mt-14">
        <div className="absolute bottom-2 left-6 top-2 hidden w-px bg-slate-200 sm:block" />
        <div className="space-y-8 sm:space-y-10">
          {steps.map((step) => (
            <div key={step.n} className="relative flex gap-4 sm:gap-6 sm:pl-2">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs text-brass sm:h-12 sm:w-12 sm:text-sm">
                {step.n}
              </div>
              <div className="min-w-0 pt-1 sm:pt-1.5">
                <h3 className="font-display text-base text-ink sm:text-lg">{step.title}</h3>
                <p className="mt-1.5 max-w-xl text-sm text-slate-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
