"use client";

import { ScanLine, Search, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChipGroup, type ChipOption } from "@/components/ui/chip-group";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/lib/firebase/categories-context";
import {
  addItem,
  adjustItemQuantity,
  type ItemInput,
} from "@/lib/firebase/items";
import {
  addDays,
  FOOD_PRESETS,
  normalizeItemName,
  type FoodPreset,
} from "@/lib/presets";
import { cn } from "@/lib/utils";
import {
  STORAGE_LOCATION_LABELS,
  type Category,
  type InventoryItem,
  type StorageLocation,
} from "@/lib/types/inventory";

/** 「よく使う」に並べる件数 */
const RECENT_LIMIT = 18;

/** 辞書のカテゴリ絞り込みで「すべて」を表す値 */
const PRESET_CATEGORY_ALL = "__all__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  /** 在庫一覧 (履歴として使う。数量 0 の「切らし中」も含む) */
  items: InventoryItem[];
  /** 保管場所タブが選ばれていればそれを既定にする */
  defaultLocation?: StorageLocation;
  onOpenScanner: () => void;
  /** トーストの「調整」から詳細フォームを開く */
  onAdjust: (itemName: string) => void;
}

function presetToItemInput(
  preset: FoodPreset,
  categories: Category[],
): ItemInput {
  const category = categories.find((c) => c.name === preset.categoryName);
  return {
    name: preset.name,
    location: preset.location,
    categoryId: category?.id ?? null,
    quantity: 1,
    requiredQuantity: preset.staple ? 1 : 0,
    unit: preset.unit,
    expiresAt:
      preset.expireDays === null
        ? null
        : addDays(new Date(), preset.expireDays),
  };
}

function describeInput(input: ItemInput): string {
  const parts = [STORAGE_LOCATION_LABELS[input.location]];
  parts.push(`${input.quantity}${input.unit ?? ""}`);
  if (input.expiresAt) {
    parts.push(
      `期限 ${input.expiresAt.getMonth() + 1}/${input.expiresAt.getDate()}`,
    );
  }
  return parts.join("・");
}

function Chip({
  label,
  sublabel,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string;
  sublabel?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "muted" | "accent";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex shrink-0 items-baseline gap-1 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50",
        variant === "accent"
          ? "border-primary bg-primary text-primary-foreground"
          : variant === "muted"
            ? "border-dashed border-border bg-card text-muted-foreground hover:text-foreground"
            : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5",
      )}
    >
      <span>{label}</span>
      {sublabel && (
        <span
          className={cn(
            "text-[10px] font-normal",
            variant === "accent"
              ? "text-primary-foreground/80"
              : "text-muted-foreground",
          )}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

/**
 * タップだけで在庫を足すシート。
 *
 * - 既に登録済みの品目 (「よく使う」) はタップで +1。切らし中のものもここから戻せる。
 * - 未登録の品目は内蔵辞書のチップをタップした瞬間に既定値で登録される。
 * - 検索欄には autoFocus を付けない。開いた瞬間にキーボードが出ないことがこの画面の要。
 */
export function QuickAddSheet({
  open,
  onOpenChange,
  householdId,
  items,
  defaultLocation,
  onOpenScanner,
  onAdjust,
}: Props) {
  const { categories } = useCategories();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [presetCategory, setPresetCategory] = useState<string>(PRESET_CATEGORY_ALL);

  const normalizedQuery = normalizeItemName(query);

  const existingByName = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    for (const item of items) {
      const key = normalizeItemName(item.name);
      // subscribeToItems は updatedAt 降順なので、最初に見つかったものが最新
      if (!map.has(key)) map.set(key, item);
    }
    return map;
  }, [items]);

  const recentItems = useMemo(() => {
    const matched = normalizedQuery
      ? items.filter((i) => normalizeItemName(i.name).includes(normalizedQuery))
      : items;
    return matched.slice(0, normalizedQuery ? RECENT_LIMIT * 2 : RECENT_LIMIT);
  }, [items, normalizedQuery]);

  const presetGroups = useMemo(() => {
    const groups = new Map<string, FoodPreset[]>();
    for (const preset of FOOD_PRESETS) {
      const key = normalizeItemName(preset.name);
      // 既に在庫にあるものは「よく使う」側に出るので辞書からは省く
      if (existingByName.has(key)) continue;
      if (normalizedQuery && !key.includes(normalizedQuery)) continue;
      const list = groups.get(preset.categoryName);
      if (list) list.push(preset);
      else groups.set(preset.categoryName, [preset]);
    }
    return [...groups.entries()];
  }, [existingByName, normalizedQuery]);

  // 検索中は全カテゴリから拾う。選択中のカテゴリが空になったら「すべて」に戻す
  const activePresetCategory =
    normalizedQuery || !presetGroups.some(([name]) => name === presetCategory)
      ? PRESET_CATEGORY_ALL
      : presetCategory;

  const visiblePresetGroups =
    activePresetCategory === PRESET_CATEGORY_ALL
      ? presetGroups
      : presetGroups.filter(([name]) => name === activePresetCategory);

  const presetCategoryOptions: ChipOption[] = [
    { value: PRESET_CATEGORY_ALL, label: "すべて" },
    ...presetGroups.map(([name]) => ({ value: name, label: name })),
  ];

  const hasAnyResult = recentItems.length > 0 || presetGroups.length > 0;

  const notifyAdded = useCallback(
    (name: string, detail: string) => {
      toast.success(`${name} を追加（${detail}）`, {
        action: { label: "調整", onClick: () => onAdjust(name) },
      });
    },
    [onAdjust],
  );

  const handleBumpExisting = useCallback(
    async (item: InventoryItem) => {
      setBusyKey(item.id);
      try {
        const next = await adjustItemQuantity(householdId, item.id, 1);
        toast.success(`${item.name} を ${next}${item.unit ?? ""} に`, {
          action: { label: "調整", onClick: () => onAdjust(item.name) },
        });
      } catch (error) {
        console.error(error);
        toast.error("追加に失敗しました");
      } finally {
        setBusyKey(null);
      }
    },
    [householdId, onAdjust],
  );

  const handleAddPreset = useCallback(
    async (preset: FoodPreset) => {
      // 同名が既にあれば重複作成せず +1 にマージする
      const existing = existingByName.get(normalizeItemName(preset.name));
      if (existing) {
        await handleBumpExisting(existing);
        return;
      }
      setBusyKey(preset.name);
      try {
        const input = presetToItemInput(preset, categories);
        await addItem(householdId, input);
        notifyAdded(preset.name, describeInput(input));
      } catch (error) {
        console.error(error);
        toast.error("追加に失敗しました");
      } finally {
        setBusyKey(null);
      }
    },
    [categories, existingByName, handleBumpExisting, householdId, notifyAdded],
  );

  const handleAddFreeform = useCallback(async () => {
    const name = query.trim();
    if (!name) return;
    const existing = existingByName.get(normalizeItemName(name));
    if (existing) {
      await handleBumpExisting(existing);
      setQuery("");
      return;
    }
    setBusyKey(name);
    try {
      const input: ItemInput = {
        name,
        location: defaultLocation ?? "fridge",
        categoryId: null,
        quantity: 1,
        requiredQuantity: 0,
        unit: undefined,
        expiresAt: null,
      };
      await addItem(householdId, input);
      notifyAdded(name, describeInput(input));
      setQuery("");
    } catch (error) {
      console.error(error);
      toast.error("追加に失敗しました");
    } finally {
      setBusyKey(null);
    }
  }, [
    defaultLocation,
    existingByName,
    handleBumpExisting,
    householdId,
    notifyAdded,
    query,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* initialFocus を見出しに向ける。既定では最初のフォーカス可能要素 (絞り込み欄) に
          フォーカスが入り、iOS でシートを開いた瞬間にキーボードが せり上がってしまう */}
      <DialogContent variant="sheet" className="gap-3" initialFocus={headingRef}>
        <DialogHeader>
          <DialogTitle ref={headingRef} tabIndex={-1} className="outline-none">
            タップして追加
          </DialogTitle>
          <DialogDescription>
            タップした品目がそのまま在庫に入ります。
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="絞り込む（任意）"
              className="h-11 pl-9 pr-9 text-sm"
              aria-label="品目を絞り込む"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="絞り込みをクリア"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            className="h-11 shrink-0 px-3"
            onClick={onOpenScanner}
          >
            <ScanLine /> スキャン
          </Button>
        </div>

        {!normalizedQuery && presetGroups.length > 0 && (
          <ChipGroup
            aria-label="カテゴリで絞り込む"
            scroll
            value={activePresetCategory}
            onValueChange={setPresetCategory}
            options={presetCategoryOptions}
          />
        )}

        <div className="-mx-1 max-h-[65dvh] space-y-2.5 overflow-y-auto px-1 pb-1">
          {recentItems.length > 0 && (
            <section>
              <h3 className="mb-1 text-[11px] font-semibold text-muted-foreground">
                よく使う
              </h3>
              <div className="flex flex-wrap gap-1">
                {recentItems.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.name}
                    sublabel={
                      item.quantity > 0
                        ? `${item.quantity}${item.unit ?? ""}`
                        : "切らし中"
                    }
                    variant={item.quantity > 0 ? "default" : "muted"}
                    disabled={busyKey !== null}
                    onClick={() => void handleBumpExisting(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {visiblePresetGroups.map(([categoryName, presets]) => (
            <section key={categoryName}>
              {activePresetCategory === PRESET_CATEGORY_ALL && (
                <h3 className="mb-1 text-[11px] font-semibold text-muted-foreground">
                  {categoryName}
                </h3>
              )}
              <div className="flex flex-wrap gap-1">
                {presets.map((preset) => (
                  <Chip
                    key={preset.name}
                    label={preset.name}
                    disabled={busyKey !== null}
                    onClick={() => void handleAddPreset(preset)}
                  />
                ))}
              </div>
            </section>
          ))}

          {query.trim() && !hasAnyResult && (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                候補にありません
              </p>
              <Button
                onClick={() => void handleAddFreeform()}
                disabled={busyKey !== null}
              >
                「{query.trim()}」を追加
              </Button>
            </div>
          )}

          {!query.trim() && !hasAnyResult && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              候補がありません。
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
