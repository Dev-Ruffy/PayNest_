import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-gradient px-4 text-center text-parchment">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brass/10 text-brass">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-display text-3xl">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-300">
        The page you&apos;re looking for doesn&apos;t exist, or you may not have access to it.
      </p>
      <Link href="/" className="mt-8">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </div>
  );
}
