import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="PayNest"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  );
}
