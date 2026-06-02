"use client";

import { AlertTriangle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExpirationSummary } from "@/lib/expiration";

interface Props {
  summary: ExpirationSummary;
  notificationStatus: "default" | "granted" | "denied" | "unsupported";
  onEnableNotifications: () => void;
}

export function ExpirationSummaryBanner({
  summary,
  notificationStatus,
  onEnableNotifications,
}: Props) {
  if (summary.totalAlerts === 0) return null;

  const hasExpired = summary.expired.length > 0;
  const tone = hasExpired
    ? "border-destructive/40 bg-destructive/10 text-destructive"
    : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";

  return (
    <div
      className={`flex flex-wrap items-start gap-3 rounded-lg border p-3 text-sm ${tone}`}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {hasExpired
            ? `期限切れ ${summary.expired.length} 件${summary.soon.length > 0 ? ` / 期限間近 ${summary.soon.length} 件` : ""}`
            : `期限間近 ${summary.soon.length} 件`}
        </p>
        <p className="mt-0.5 text-xs opacity-80">
          {hasExpired
            ? "早めに使い切るか処分してください。"
            : "3日以内に賞味期限を迎えるアイテムがあります。"}
        </p>
      </div>
      {notificationStatus === "default" && (
        <Button size="sm" variant="outline" onClick={onEnableNotifications}>
          <Bell /> 通知をON
        </Button>
      )}
    </div>
  );
}
