import type { Timestamp } from "firebase/firestore";
import type { InventoryItem } from "@/lib/types/inventory";

export type ExpirationStatus = "expired" | "soon" | "ok" | "none";

export interface ExpirationInfo {
  status: ExpirationStatus;
  daysRemaining: number | null;
  label: string;
}

export function getExpirationInfo(
  expiresAt: Timestamp | null | undefined,
  now: Date = new Date(),
): ExpirationInfo {
  if (!expiresAt) {
    return { status: "none", daysRemaining: null, label: "期限なし" };
  }
  const target = expiresAt.toDate();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      status: "expired",
      daysRemaining: days,
      label: `${Math.abs(days)}日経過`,
    };
  }
  if (days === 0) return { status: "soon", daysRemaining: 0, label: "本日まで" };
  if (days <= 3) return { status: "soon", daysRemaining: days, label: `あと${days}日` };
  return { status: "ok", daysRemaining: days, label: `あと${days}日` };
}

export function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  const d = ts.toDate();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export interface ExpirationSummary {
  expired: InventoryItem[];
  soon: InventoryItem[];
  totalAlerts: number;
}

export function summarizeExpirations(
  items: InventoryItem[],
  now: Date = new Date(),
): ExpirationSummary {
  const expired: InventoryItem[] = [];
  const soon: InventoryItem[] = [];
  for (const item of items) {
    const info = getExpirationInfo(item.expiresAt, now);
    if (info.status === "expired") expired.push(item);
    else if (info.status === "soon") soon.push(item);
  }
  return { expired, soon, totalAlerts: expired.length + soon.length };
}
