"use client";

import { ChevronDown, LayoutList, Plus, Rows3, ScanLine, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChipGroup, type ChipOption } from "@/components/ui/chip-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeScannerDialog } from "@/components/inventory/barcode-scanner-dialog";
import { ExpirationSummaryBanner } from "@/components/inventory/expiration-summary";
import { ItemCard } from "@/components/inventory/item-card";
import {
  ItemFormDialog,
  type ItemFormInitialValues,
} from "@/components/inventory/item-form-dialog";
import { QuickAddSheet } from "@/components/inventory/quick-add-sheet";
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
  getInventoryDensity,
  setInventoryDensity,
  type InventoryDensity,
} from "@/lib/view-preferences";
import {
  STORAGE_LOCATIONS,
  STORAGE_LOCATION_LABELS,
  type InventoryItem,
  type StorageLocation,
} from "@/lib/types/inventory";

interface Props {
  householdId: string;
}

type TabValue = "all" | StorageLocation;

const SORT_OPTIONS = [
  { value: "expiration", label: "期限が近い順" },
  { value: "name", label: "名前順" },
  { value: "updated", label: "更新が新しい順" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const CATEGORY_ALL = "__all__";
const CATEGORY_NONE = "__none__";

export function InventoryView({ householdId }: Props) {
  const { categories, byId: categoriesById } = useCategories();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [sortBy, setSortBy] = useState<SortValue>("expiration");
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  // 既定はコンパクト表示。1画面に入る件数を優先し、詳細カードは切り替えで出す
  const [density, setDensity] = useState<InventoryDensity>(getInventoryDensity);
  const [formOpen, setFormOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
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

  const summary = useMemo(
    () => summarizeExpirations(items, new Date(), (item) => item.categoryId ? categoriesById.get(item.categoryId)?.name : null),
    [items, categoriesById],
  );

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
      setQuickAddOpen(false);
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

  const toggleDensity = useCallback(() => {
    setDensity((current) => {
      const next = current === "compact" ? "detailed" : "compact";
      setInventoryDensity(next);
      return next;
    });
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

  // 在庫 0 のアイテムは削除せず「切らしているもの」に退避する。
  // 履歴として残るので、次に買ったときは追加シートから + 1タップで戻せる。
  const inStock = useMemo(
    () => filtered.filter((i) => i.quantity > 0),
    [filtered],
  );
  const outOfStock = useMemo(
    () => filtered.filter((i) => i.quantity <= 0),
    [filtered],
  );

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
    setQuickAddOpen(true);
  };

  /** 追加直後のトーストから、その品目の詳細フォームを開く */
  const openAdjustByName = useCallback(
    (itemName: string) => {
      const target = items.find((i) => i.name === itemName);
      if (!target) return;
      setQuickAddOpen(false);
      setEditing(target);
      setInitialValues(undefined);
      setFormOpen(true);
    },
    [items],
  );

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

  const locationFilterOptions: ChipOption[] = [
    { value: "all", label: `すべて (${items.length})` },
    ...STORAGE_LOCATIONS.map((loc) => ({
      value: loc,
      label: `${STORAGE_LOCATION_LABELS[loc]} (${countByLocation.get(loc) ?? 0})`,
    })),
  ];

  const categoryFilterOptions: ChipOption[] = [
    { value: CATEGORY_ALL, label: "全て" },
    { value: CATEGORY_NONE, label: "未分類" },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];

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

      <div
        className="sticky z-20 border-b border-border/60 bg-background"
        style={{ top: "calc(env(safe-area-inset-top) + 3.5rem)" }}
      >
        <div className="space-y-1.5 px-4 pt-2 pb-2 sm:px-6">
          {/* 保存場所チップ + 表示密度の切り替え */}
          <div className="flex items-center gap-2">
            <ChipGroup
              aria-label="保管場所で絞り込む"
              scroll
              className="min-w-0 flex-1"
              value={tab}
              onValueChange={(v) => setTab(v as TabValue)}
              options={locationFilterOptions}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleDensity}
              className="size-9 shrink-0 p-0"
              aria-pressed={density === "compact"}
              aria-label={
                density === "compact"
                  ? "詳細表示に切り替える"
                  : "コンパクト表示に切り替える"
              }
              title={
                density === "compact"
                  ? "詳細表示に切り替える"
                  : "コンパクト表示に切り替える"
              }
            >
              {density === "compact" ? (
                <LayoutList className="size-4" />
              ) : (
                <Rows3 className="size-4" />
              )}
            </Button>
          </div>

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
          <ChipGroup
            aria-label="カテゴリで絞り込む"
            scroll
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            options={categoryFilterOptions}
          />
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className={cn("mt-3", density === "compact" ? "space-y-1" : "space-y-2")}>
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
            <>
              {inStock.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  householdId={householdId}
                  onEdit={openEdit}
                  density={density}
                />
              ))}

              {outOfStock.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOutOfStock((v) => !v)}
                    aria-expanded={showOutOfStock}
                    className="flex w-full items-center gap-1.5 rounded-lg px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        showOutOfStock ? "rotate-0" : "-rotate-90",
                      )}
                    />
                    切らしているもの ({outOfStock.length})
                  </button>
                  {showOutOfStock && (
                    <div
                      className={cn(
                        "mt-2",
                        density === "compact" ? "space-y-1" : "space-y-2",
                      )}
                    >
                      {outOfStock.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          householdId={householdId}
                          onEdit={openEdit}
                          density={density}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        householdId={householdId}
        items={items}
        defaultLocation={defaultLocation}
        onOpenScanner={handleOpenScanner}
        onAdjust={openAdjustByName}
      />

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
