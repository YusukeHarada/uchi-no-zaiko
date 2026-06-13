"use client";

import { Plus, ScanLine, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScannerDialog } from "@/components/inventory/barcode-scanner-dialog";
import { ExpirationSummaryBanner } from "@/components/inventory/expiration-summary";
import { ItemCard } from "@/components/inventory/item-card";
import {
  ItemFormDialog,
  type ItemFormInitialValues,
} from "@/components/inventory/item-form-dialog";
import { useCategories } from "@/lib/firebase/categories-context";
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

const SORT_OPTIONS = [
  { value: "expiration", label: "期限が近い順" },
  { value: "name", label: "名前順" },
  { value: "updated", label: "更新が新しい順" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const CATEGORY_ALL = "__all__";
const CATEGORY_NONE = "__none__";

export function InventoryView({ householdId }: Props) {
  const { categories } = useCategories();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [sortBy, setSortBy] = useState<SortValue>("expiration");
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [initialValues, setInitialValues] =
    useState<ItemFormInitialValues | undefined>(undefined);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStream, setScannerStream] = useState<MediaStream | null>(null);
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

  const stopScannerStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((t) => t.stop());
  }, []);

  const handleOpenScanner = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("このブラウザはカメラに対応していません");
      return;
    }
    try {
      // iOS Safari はユーザー操作の直接の応答内で getUserMedia を呼ばないと
      // 権限ダイアログを出さない & ストリーム attach が安定しないため、ここで
      // 取得したストリームをそのまま Dialog の video 要素に渡す
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setScannerStream(stream);
      setScannerOpen(true);
    } catch (error) {
      console.error("Camera permission denied", error);
      toast.error(
        "カメラを使用できません。ブラウザの設定でカメラを許可してください。",
      );
    }
  }, []);

  const handleCloseScanner = useCallback(
    (open: boolean) => {
      setScannerOpen(open);
      if (!open) {
        stopScannerStream(scannerStream);
        setScannerStream(null);
      }
    },
    [scannerStream, stopScannerStream],
  );

  useEffect(() => {
    return () => {
      stopScannerStream(scannerStream);
    };
  }, [scannerStream, stopScannerStream]);

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
    const q = search.trim().toLowerCase();
    let next = items;

    if (tab !== "all") {
      next = next.filter((i) => i.location === tab);
    }
    if (categoryFilter === CATEGORY_NONE) {
      next = next.filter((i) => !i.categoryId);
    } else if (categoryFilter !== CATEGORY_ALL) {
      next = next.filter((i) => i.categoryId === categoryFilter);
    }
    if (showOnlyLowStock) {
      next = next.filter(
        (i) => i.requiredQuantity > 0 && i.quantity < i.requiredQuantity,
      );
    }
    if (q) {
      next = next.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.note ?? "").toLowerCase().includes(q) ||
          (i.barcode ?? "").toLowerCase().includes(q),
      );
    }

    if (sortBy === "name") {
      next = [...next].sort((a, b) =>
        a.name.localeCompare(b.name, "ja"),
      );
    } else if (sortBy === "expiration") {
      next = [...next].sort((a, b) => {
        const at = a.expiresAt?.toMillis();
        const bt = b.expiresAt?.toMillis();
        if (at == null && bt == null) return 0;
        if (at == null) return 1;
        if (bt == null) return -1;
        return at - bt;
      });
    }
    // "updated" は Firestore からの順序 (updatedAt desc) をそのまま使う

    return next;
  }, [items, tab, categoryFilter, sortBy, showOnlyLowStock, search]);

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
    stopScannerStream(scannerStream);
    setScannerStream(null);
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
  }, [scannerStream, stopScannerStream]);

  const defaultLocation: StorageLocation =
    tab === "all" ? "fridge" : (tab as StorageLocation);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="space-y-4 px-4 pt-4 pb-0 sm:px-6 sm:pt-6">
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
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <div className="sticky top-14 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
          <div className="space-y-2 px-4 pt-3 pb-3 sm:px-6">
            {/* 保存場所タブ */}
            <TabsList className="h-11 w-full overflow-x-auto">
              <TabsTrigger value="all" className="h-10 px-4">すべて ({items.length})</TabsTrigger>
              {STORAGE_LOCATIONS.map((loc) => (
                <TabsTrigger key={loc} value={loc} className="h-10 px-4">
                  {STORAGE_LOCATION_LABELS[loc]} ({countByLocation.get(loc) ?? 0})
                </TabsTrigger>
              ))}
            </TabsList>

            {/* 検索・並び順・在庫不足 */}
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="名前 / メモ / バーコードで検索"
                  className="h-9 pl-9 pr-8 text-sm"
                  aria-label="検索"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="検索をクリア"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortValue)}
              >
                <SelectTrigger className="h-9 w-auto shrink-0 px-2.5 text-xs" aria-label="並び順">
                  <SelectValue>
                    {(v: SortValue | null) =>
                      v ? (SORT_OPTIONS.find((o) => o.value === v)?.label ?? "") : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant={showOnlyLowStock ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyLowStock((v) => !v)}
                className="h-9 shrink-0 px-2.5 text-xs"
                aria-pressed={showOnlyLowStock}
              >
                在庫不足のみ
              </Button>
            </div>

            {/* カテゴリチップ */}
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {([
                { id: CATEGORY_ALL, name: "全て" },
                { id: CATEGORY_NONE, name: "未分類" },
                ...categories,
              ] as { id: string; name: string }[]).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors",
                    categoryFilter === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          {TAB_VALUES.map((value) => (
            <TabsContent key={value} value={value} className="mt-4 space-y-2">
              {loading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  読み込み中…
                </p>
              ) : filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  {items.length === 0
                    ? "アイテムがありません。「追加」または「スキャン」から登録できます。"
                    : "条件に合うアイテムがありません。"}
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
        </div>
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
        onOpenChange={handleCloseScanner}
        onScan={handleScan}
        stream={scannerStream}
      />
    </div>
  );
}
