"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const links = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // The navbar is transparent (floating over the dark hero) until the page is
  // scrolled, at which point it gets a light glass background — so text needs
  // to flip color with it rather than assuming one background forever.
  const wordmarkColor = scrolled ? "text-ink" : "text-parchment";
  const linkColor = scrolled ? "text-slate-600" : "text-parchment/85";

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300",
          scrolled ? "glass-panel shadow-card py-3" : "py-5"
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className={cn("font-display text-lg font-medium transition-colors", wordmarkColor)}>PayNest</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn("text-sm font-medium hover:text-brass transition-colors", linkColor)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/join-school" className="hidden sm:inline-flex">
              <Button size="sm" className="border border-brass/30 bg-ink text-brass hover:bg-ink-soft">
                Join Existing School
              </Button>
            </Link>
            <Link href="/signup/school">
              <Button variant="primary" size="sm">
                Sign Up School
              </Button>
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className={cn("rounded-lg p-1.5 transition-colors md:hidden", scrolled ? "text-ink" : "text-parchment")}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </motion.header>

      {/*
        Deliberately rendered OUTSIDE <motion.header>. Framer Motion animates that
        header via a CSS transform, and per the CSS spec, a transformed ancestor
        becomes the containing block for any `position: fixed` descendant — so a
        fixed-position drawer nested inside it would size itself against the
        header's own (short) box instead of the real viewport, with content
        spilling out past it with no background behind it. Keeping the drawer as
        a sibling avoids that entirely.
      */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-ink p-6 md:hidden"
            >
              <div className="flex items-center justify-between">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                  <Logo size={28} />
                  <span className="font-display text-base font-medium text-parchment">PayNest</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-parchment" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-10 flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-2 py-3 text-base font-medium text-parchment/90 hover:bg-white/5 hover:text-brass transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 flex flex-col gap-3">
                <Link href="/join-school" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full border border-brass/30 bg-white/5 text-brass hover:bg-white/10">
                    Join Existing School
                  </Button>
                </Link>
                <Link href="/signup/school" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Sign Up School
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
