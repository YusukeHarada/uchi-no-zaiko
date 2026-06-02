"use client";

import { Plus, ScanLine } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScannerDialog } from "@/components/inventory/barcode-scanner-dialog";
import { ExpirationSummaryBanner } from "@/components/inventory/expiration-summary";
import { ItemCard } from "@/components/inventory/item-card";
import {
  ItemFormDialog,
  type ItemFormInitialValues,
} from "@/components/inventory/item-form-dialog";
import { subscribeToItems } from "@/lib/firebase/items";
import { summarizeExpirations } from "@/lib/expiration";
import {
  getNotificationStatus,
  markNotifiedToday,
  requestNotificationPermission,
  sendNotification,
  shouldNotifyToday,
  type NotificationStatus,
} from "@/lib/notifications";
import { lookupProductByBarcode } from "@/lib/product-lookup";
import {
  STORAGE_LOCATIONS,
  STORAGE_LOCATION_LABELS,
  type InventoryItem,
  type StorageLocation,
} from "@/lib/types/inventory";

interface Props {
  householdId: string;
}

const TAB_VALUES = ["all", ...STORAGE_LOCATIONS] as const;
type TabValue = (typeof TAB_VALUES)[number];

export function InventoryView({ householdId }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [initialValues, setInitialValues] =
    useState<ItemFormInitialValues | undefined>(undefined);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationStatus>("unsupported");
  const handlingScanRef = useRef(false);
  const notifiedRef = useRef(false);

  useEffect(() => {
    setNotificationStatus(getNotificationStatus());
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToItems(
      householdId,
      (next) => {
        setItems(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [householdId]);

  const summary = useMemo(() => summarizeExpirations(items), [items]);

  useEffect(() => {
    if (loading) return;
    if (notifiedRef.current) return;
    if (notificationStatus !== "granted") return;
    if (summary.totalAlerts === 0) return;
    if (!shouldNotifyToday()) return;

    const title =
      summary.expired.length > 0
        ? `期限切れ ${summary.expired.length} 件あります`
        : `期限間近 ${summary.soon.length} 件あります`;
    const previewNames = [...summary.expired, ...summary.soon]
      .slice(0, 3)
      .map((i) => i.name)
      .join("、");
    const body =
      summary.totalAlerts > 3
        ? `${previewNames} ほか ${summary.totalAlerts - 3} 件`
        : previewNames;

    const sent = sendNotification({ title, body, tag: "expiration-summary" });
    if (sent) {
      markNotifiedToday();
      notifiedRef.current = true;
    }
  }, [loading, notificationStatus, summary]);

  const handleOpenScanner = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("このブラウザはカメラに対応していません");
      return;
    }
    try {
      // iOS Safari はユーザー操作の直接の応答内で getUserMedia を呼ばないと
      // 権限ダイアログを出さないため、ここで先に取得して即座に停止する
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((t) => t.stop());
      setScannerOpen(true);
    } catch (error) {
      console.error("Camera permission denied", error);
      toast.error(
        "カメラを使用できません。ブラウザの設定でカメラを許可してください。",
      );
    }
  }, []);

  const handleEnableNotifications = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotificationStatus(result);
    if (result === "granted") {
      toast.success("通知を有効にしました");
    } else if (result === "denied") {
      toast.error("通知が拒否されました。ブラウザの設定から許可してください。");
    } else if (result === "unsupported") {
      toast.error("このブラウザは通知に対応していません");
    }
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((i) => i.location === tab);
  }, [items, tab]);

  const countByLocation = useMemo(() => {
    const map = new Map<StorageLocation, number>();
    for (const loc of STORAGE_LOCATIONS) map.set(loc, 0);
    for (const item of items) {
      map.set(item.location, (map.get(item.location) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setInitialValues(undefined);
    setFormOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setInitialValues(undefined);
    setFormOpen(true);
  };

  const handleScan = useCallback(async (barcode: string) => {
    if (handlingScanRef.current) return;
    handlingScanRef.current = true;
    setScannerOpen(false);
    toast.info(`バーコード: ${barcode}`);
    try {
      const result = await lookupProductByBarcode(barcode);
      if (result.name) {
        toast.success(`商品名: ${result.name}`);
      } else {
        toast.warning("商品データが見つかりませんでした。手入力してください。");
      }
      setEditing(null);
      setInitialValues({ name: result.name ?? "", barcode });
      setFormOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("商品検索に失敗しました");
      setEditing(null);
      setInitialValues({ name: "", barcode });
      setFormOpen(true);
    } finally {
      handlingScanRef.current = false;
    }
  }, []);

  const defaultLocation: StorageLocation =
    tab === "all" ? "fridge" : (tab as StorageLocation);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">在庫</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenScanner}>
            <ScanLine /> スキャン
          </Button>
          <Button onClick={openCreate}>
            <Plus /> 追加
          </Button>
        </div>
      </div>

      <ExpirationSummaryBanner
        summary={summary}
        notificationStatus={notificationStatus}
        onEnableNotifications={handleEnableNotifications}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all">すべて ({items.length})</TabsTrigger>
          {STORAGE_LOCATIONS.map((loc) => (
            <TabsTrigger key={loc} value={loc}>
              {STORAGE_LOCATION_LABELS[loc]} ({countByLocation.get(loc) ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_VALUES.map((value) => (
          <TabsContent key={value} value={value} className="mt-4 space-y-2">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                読み込み中…
              </p>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                アイテムがありません。「追加」または「スキャン」から登録できます。
              </div>
            ) : (
              filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  householdId={householdId}
                  onEdit={openEdit}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ItemFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            setInitialValues(undefined);
          }
        }}
        householdId={householdId}
        item={editing}
        defaultLocation={defaultLocation}
        initialValues={initialValues}
      />

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
      />
    </div>
  );
}
