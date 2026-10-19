"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How does a student's wallet get funded?",
    a: "Parents pay the school in the way it prefers: cash handed to the Housemaster, or a bank transfer to the school's account. The Accountant (or the Housemaster) then credits the exact amount to the student's PayNest wallet.",
  },
  {
    q: "What stops someone else from spending a student's balance?",
    a: "Every tuck shop purchase requires the student's PIN. The Seller cannot complete a sale without it, and the PIN is never visible to the Seller.",
  },
  {
    q: "How do younger students or large groups buy without a PIN?",
    a: "Housemasters can place a bulk order. They pick the students, choose products from the Seller's price list (with quantities), and confirm. Totals are calculated automatically, students without enough balance are skipped, and every charged student gets their own separate transaction.",
  },
  {
    q: "Can we limit how much a student can be credited or spend?",
    a: "Yes, and it's optional. When registering, or later in Settings, the Admin can set a maximum amount a student can be credited per term or session, and a maximum a student can spend per day.",
  },
  {
    q: "Can our school have more than one Accountant or Seller?",
    a: "Each school has exactly one Accountant and one Tuck Shop Seller at a time. If the Admin removes one, the role opens back up for a new sign-up immediately.",
  },
  {
    q: "How long does school approval take?",
    a: "After you submit your school's registration, the PayNest developer reviews it, typically within a few minutes, before a verification code is emailed to your school address.",
  },
  {
    q: "What happens to our data if we ever leave PayNest?",
    a: "Your school's admin can request full data export or deletion at any time by contacting the PayNest developer directly. Contact details are at the bottom of this page.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-brass-700">FAQ</span>
        <h2 className="mt-3 font-display text-2xl text-ink sm:text-4xl">Questions, answered.</h2>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={faq.q} className="rounded-xl2 border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-medium text-ink">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-slate-500">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
