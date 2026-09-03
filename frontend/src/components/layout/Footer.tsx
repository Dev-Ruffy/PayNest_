import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Sign Up School", href: "/signup/school" },
      { label: "Join Existing School", href: "/join-school" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "#contact" },
      { label: "FAQ", href: "#faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-parchment-paper">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-display text-lg font-medium text-ink">PayNest</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              The digital wallet built for boarding schools — safer than cash, simpler than a bank account.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-ink">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-400 hover:text-ink transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} PayNest. All rights reserved.</p>
          <p>Built for schools that still count every naira.</p>
        </div>
      </div>
    </footer>
  );
}
