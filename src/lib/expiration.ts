import type { Timestamp } from "firebase/firestore";
import type { InventoryItem } from "@/lib/types/inventory";

export type ExpirationStatus = "expired" | "soon" | "ok" | "none";

export interface ExpirationInfo {
  status: ExpirationStatus;
  daysRemaining: number | null;
  label: string;
}

// カテゴリ名ごとの「もうすぐ期限切れ」警告日数
// 食材の傷みやすさに応じて設定
const CATEGORY_SOON_DAYS: Record<string, number> = {
  魚: 2,       // 非常に傷みやすい
  肉: 3,       // 冷蔵で2〜3日
  野菜: 5,     // 葉物〜根菜の中間
  乳製品: 5,   // 牛乳・ヨーグルト等
  飲料: 7,
  お菓子: 7,
  冷凍食品: 14, // 冷凍でも品質劣化があるため早めに通知
  レトルト: 14,
  調味料: 14,
};

const DEFAULT_SOON_DAYS = 3;

export function getSoonThreshold(categoryName?: string | null): number {
  if (categoryName && categoryName in CATEGORY_SOON_DAYS) {
    return CATEGORY_SOON_DAYS[categoryName];
  }
  return DEFAULT_SOON_DAYS;
}

export function getExpirationInfo(
  expiresAt: Timestamp | null | undefined,
  now: Date = new Date(),
  categoryName?: string | null,
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
  const soonDays = getSoonThreshold(categoryName);
  if (days <= soonDays) return { status: "soon", daysRemaining: days, label: `あと${days}日` };
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
  getCategoryName?: (item: InventoryItem) => string | null | undefined,
): ExpirationSummary {
  const expired: InventoryItem[] = [];
  const soon: InventoryItem[] = [];
  for (const item of items) {
    const categoryName = getCategoryName ? getCategoryName(item) : null;
    const info = getExpirationInfo(item.expiresAt, now, categoryName);
    if (info.status === "expired") expired.push(item);
    else if (info.status === "soon") soon.push(item);
  }
  return { expired, soon, totalAlerts: expired.length + soon.length };
}
