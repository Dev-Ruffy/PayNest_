"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TerminalSquare } from "lucide-react";

export function DeveloperLoginFab() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, duration: 0.4 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <Link
        href="/login/developer"
        className="group flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-xs font-medium text-parchment shadow-cardHover transition-all hover:pr-5"
      >
        <TerminalSquare className="h-4 w-4 text-brass" />
        <span className="hidden group-hover:inline">Developer Login</span>
      </Link>
    </motion.div>
  );
}
