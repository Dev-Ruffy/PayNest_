import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

/**
 * Groups a list (already sorted newest-first) into labeled day sections —
 * "Today", "Yesterday", then a formatted date for anything older. Used to turn
 * a flat activity feed into an organized, scannable timeline.
 */
export function groupByDate<T extends { createdAt: string }>(items: T[]): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86_400_000).toDateString();

  for (const item of items) {
    const d = new Date(item.createdAt);
    const dayStr = d.toDateString();
    const label =
      dayStr === todayStr
        ? "Today"
        : dayStr === yesterdayStr
          ? "Yesterday"
          : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(d);

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return groups;
}

export function statusToTone(status: string): "gold" | "emerald" | "brick" | "slate" {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "SUCCESS":
      return "emerald";
    case "PENDING":
    case "PENDING_VERIFICATION":
    case "CODE_SENT":
      return "gold";
    case "REJECTED":
    case "SUSPENDED":
    case "FAILED":
      return "brick";
    default:
      return "slate";
  }
}
