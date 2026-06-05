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

  return (
    <div
      className={
        hasExpired
          ? "flex flex-wrap items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 p-3.5 text-sm text-destructive"
          : "flex flex-wrap items-start gap-3 rounded-xl border border-amber-400/35 bg-amber-400/10 p-3.5 text-sm text-amber-700 dark:text-amber-300"
      }
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">
          {hasExpired
            ? `期限切れ ${summary.expired.length} 件${summary.soon.length > 0 ? ` ・ 期限間近 ${summary.soon.length} 件` : ""}`
            : `期限間近 ${summary.soon.length} 件`}
        </p>
        <p className="mt-0.5 text-xs opacity-75">
          {hasExpired
            ? "早めに使い切るか処分してください。"
            : "3日以内に賞味期限を迎えるアイテムがあります。"}
        </p>
      </div>
      {notificationStatus === "default" && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 h-7 text-xs"
          onClick={onEnableNotifications}
        >
          <Bell className="size-3" /> 通知をON
        </Button>
      )}
    </div>
  );
}
