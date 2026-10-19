import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const CONTACT_EMAIL = "rufaimuizz@gmail.com";
const WHATSAPP_NUMBER = "09129193132";
const WHATSAPP_LINK = "https://wa.me/2349129193132";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Sign Up School", href: "/signup/school" },
      { label: "Join Existing School", href: "/join-school" },
    ],
  },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-parchment-paper">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.3fr_1fr_1fr_1.4fr] md:gap-12">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-display text-lg font-medium text-ink">PayNest</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              The digital wallet built for boarding schools. Safer than cash, simpler than a bank account.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-ink">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-500 transition-colors hover:text-ink">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-semibold text-ink">Contact us</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-start gap-2 break-all text-sm text-slate-500 transition-colors hover:text-ink"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brass-700" />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-ink"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-brass-700" />
                  WhatsApp: {WHATSAPP_NUMBER}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-center text-xs text-slate-400 sm:mt-14 sm:flex-row sm:pt-8 sm:text-left">
          <p>© {new Date().getFullYear()} PayNest. All rights reserved.</p>
          <p>Built for schools that still count every naira.</p>
        </div>
      </div>
    </footer>
  );
}
