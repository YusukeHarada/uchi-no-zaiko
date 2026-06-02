export type NotificationStatus =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export function getNotificationStatus(): NotificationStatus {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationStatus;
}

export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result as NotificationStatus;
}

export interface SendNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
}

export function sendNotification(options: SendNotificationOptions): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  try {
    new Notification(options.title, {
      body: options.body,
      icon: options.icon ?? "/icon1",
      tag: options.tag,
    });
    return true;
  } catch (error) {
    console.error("Failed to send notification", error);
    return false;
  }
}

const STORAGE_KEY = "uchi-no-zaiko:last-notified-date";

export function shouldNotifyToday(now: Date = new Date()): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = window.localStorage.getItem(STORAGE_KEY);
    const today = formatDateKey(now);
    return last !== today;
  } catch {
    return false;
  }
}

export function markNotifiedToday(now: Date = new Date()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, formatDateKey(now));
  } catch {
    /* noop */
  }
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
