"use client";

import { Timestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChipGroup, type ChipOption } from "@/components/ui/chip-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpirationTips } from "@/components/inventory/expiration-tips";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/lib/firebase/categories-context";
import { addItem, updateItem, type ItemInput } from "@/lib/firebase/items";
import { addDays, EXPIRY_PRESETS, UNIT_PRESETS } from "@/lib/presets";
import {
  CATEGORY_COLOR_CLASSES,
  STORAGE_LOCATIONS,
  STORAGE_LOCATION_LABELS,
  type InventoryItem,
  type StorageLocation,
} from "@/lib/types/inventory";

const UNCATEGORIZED = "__none__";
const UNIT_NONE = "__none__";
const UNIT_CUSTOM = "__custom__";
const EXPIRY_NONE = "__none__";
const EXPIRY_CUSTOM = "__custom__";

export interface ItemFormInitialValues {
  name?: string;
  barcode?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  item?: InventoryItem | null;
  defaultLocation?: StorageLocation;
  initialValues?: ItemFormInitialValues;
}

function ExpirationTipsDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        保存方法の目安を見る
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>保存方法のTips</DialogTitle>
          </DialogHeader>
          <ExpirationTips />
          <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => setOpen(false)}>
            閉じる
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function timestampToDateInputValue(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function dateToInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "2026-08-26" -> "8/26" (チップに載せる短い表記) */
function formatChipDate(value: string): string {
  const [, m, d] = value.split("-");
  if (!m || !d) return value;
  return `${Number(m)}/${Number(d)}`;
}

/** 保存済みの日付が期限プリセットのどれかに当てはまるか調べる */
function matchExpiryPreset(value: string): string {
  if (!value) return EXPIRY_NONE;
  const today = new Date();
  for (const preset of EXPIRY_PRESETS) {
    if (dateToInputValue(addDays(today, preset.days)) === value) {
      return String(preset.days);
    }
  }
  return EXPIRY_CUSTOM;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  householdId,
  item,
  defaultLocation = "fridge",
  initialValues,
}: Props) {
  const isEdit = !!item;
  const { categories } = useCategories();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<StorageLocation>(defaultLocation);
  const [categoryId, setCategoryId] = useState<string>(UNCATEGORIZED);
  const [quantity, setQuantity] = useState(1);
  const [requiredQuantity, setRequiredQuantity] = useState(0);
  const [unitChoice, setUnitChoice] = useState<string>(UNIT_NONE);
  const [customUnit, setCustomUnit] = useState("");
  const [expiryChoice, setExpiryChoice] = useState<string>(EXPIRY_NONE);
  const [expiresAt, setExpiresAt] = useState("");
  const [barcode, setBarcode] = useState("");
  const [note, setNote] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (item) {
      const savedUnit = item.unit ?? "";
      const savedExpiry = timestampToDateInputValue(item.expiresAt);
      setName(item.name);
      setLocation(item.location);
      setCategoryId(item.categoryId ?? UNCATEGORIZED);
      setQuantity(item.quantity);
      setRequiredQuantity(item.requiredQuantity);
      setUnitChoice(
        !savedUnit
          ? UNIT_NONE
          : (UNIT_PRESETS as readonly string[]).includes(savedUnit)
            ? savedUnit
            : UNIT_CUSTOM,
      );
      setCustomUnit(savedUnit);
      setExpiryChoice(matchExpiryPreset(savedExpiry));
      setExpiresAt(savedExpiry);
      setBarcode(item.barcode ?? "");
      setNote(item.note ?? "");
      setShowDetails(!!item.barcode || !!item.note);
    } else {
      setName(initialValues?.name ?? "");
      setLocation(defaultLocation);
      setCategoryId(UNCATEGORIZED);
      setQuantity(1);
      setRequiredQuantity(0);
      setUnitChoice(UNIT_NONE);
      setCustomUnit("");
      setExpiryChoice(EXPIRY_NONE);
      setExpiresAt("");
      setBarcode(initialValues?.barcode ?? "");
      setNote("");
      setShowDetails(!!initialValues?.barcode);
    }
  }, [open, item, defaultLocation, initialValues]);

  const handleExpiryChoice = (choice: string) => {
    setExpiryChoice(choice);
    if (choice === EXPIRY_NONE) {
      setExpiresAt("");
    } else if (choice !== EXPIRY_CUSTOM) {
      setExpiresAt(dateToInputValue(addDays(new Date(), Number(choice))));
    }
  };

  const handleUnitChoice = (choice: string) => {
    setUnitChoice(choice);
    if (choice === UNIT_NONE) setCustomUnit("");
    else if (choice !== UNIT_CUSTOM) setCustomUnit(choice);
  };

  const resolvedUnit =
    unitChoice === UNIT_NONE
      ? ""
      : unitChoice === UNIT_CUSTOM
        ? customUnit.trim()
        : unitChoice;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("名前を入力してください");
      return;
    }

    const input: ItemInput = {
      name: name.trim(),
      location,
      categoryId: categoryId === UNCATEGORIZED ? null : categoryId,
      quantity,
      requiredQuantity,
      unit: resolvedUnit || undefined,
      expiresAt: parseDateInput(expiresAt),
      barcode: barcode.trim() || undefined,
      note: note.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (item) {
        await updateItem(householdId, item.id, input);
        toast.success("更新しました");
      } else {
        await addItem(householdId, input);
        toast.success("追加しました");
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  // 名前が空の新規追加のときだけキーボードを開く (どのみち打つしかないため)。
  // 編集時やスキャン後はタップだけで済むので、フォーカスは見出しに逃がす。
  const focusName = !isEdit && !initialValues?.name;

  const locationOptions: ChipOption[] = STORAGE_LOCATIONS.map((loc) => ({
    value: loc,
    label: STORAGE_LOCATION_LABELS[loc],
  }));

  const categoryOptions: ChipOption[] = [
    { value: UNCATEGORIZED, label: "未分類" },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
      className: CATEGORY_COLOR_CLASSES[cat.color],
    })),
  ];

  const unitOptions: ChipOption[] = [
    { value: UNIT_NONE, label: "なし" },
    ...UNIT_PRESETS.map((u) => ({ value: u, label: u })),
    { value: UNIT_CUSTOM, label: "その他" },
  ];

  const expiryOptions: ChipOption[] = [
    { value: EXPIRY_NONE, label: "なし" },
    ...EXPIRY_PRESETS.map((p) => ({ value: String(p.days), label: p.label })),
    {
      value: EXPIRY_CUSTOM,
      label:
        expiryChoice === EXPIRY_CUSTOM && expiresAt
          ? formatChipDate(expiresAt)
          : "日付を選ぶ",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="sheet"
        initialFocus={focusName ? nameRef : headingRef}
      >
        <DialogHeader>
          <DialogTitle ref={headingRef} tabIndex={-1} className="outline-none">
            {isEdit ? "アイテムを編集" : "アイテムを追加"}
          </DialogTitle>
          <DialogDescription>
            名前以外はすべてタップで選べます。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">名前 *</Label>
            <Input
              ref={nameRef}
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 牛肉 (切り落とし)"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>保管場所 *</Label>
            <ChipGroup
              aria-label="保管場所"
              value={location}
              onValueChange={(v) => setLocation(v as StorageLocation)}
              options={locationOptions}
            />
          </div>

          <div className="space-y-1.5">
            <Label>カテゴリ</Label>
            <ChipGroup
              aria-label="カテゴリ"
              value={categoryId}
              onValueChange={setCategoryId}
              options={categoryOptions}
            />
          </div>

          <div className="space-y-1.5">
            <Label>数量</Label>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              unit={resolvedUnit || undefined}
            />
          </div>

          <div className="space-y-1.5">
            <Label>単位</Label>
            <ChipGroup
              aria-label="単位"
              value={unitChoice}
              onValueChange={handleUnitChoice}
              options={unitOptions}
            />
            {unitChoice === UNIT_CUSTOM && (
              <Input
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="単位を入力（例: 束）"
                aria-label="単位を入力"
                className="mt-1.5"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="expiresAt">賞味期限</Label>
              <ExpirationTipsDialog />
            </div>
            <ChipGroup
              aria-label="賞味期限"
              value={expiryChoice}
              onValueChange={handleExpiryChoice}
              options={expiryOptions}
            />
            {expiryChoice === EXPIRY_CUSTOM && (
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1.5"
              />
            )}
          </div>

          <div className="space-y-1.5 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label>常備する</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  この数を下回ると買い物リストに出ます。
                </p>
              </div>
              <Button
                type="button"
                variant={requiredQuantity > 0 ? "default" : "outline"}
                size="sm"
                aria-pressed={requiredQuantity > 0}
                onClick={() => setRequiredQuantity(requiredQuantity > 0 ? 0 : 1)}
              >
                {requiredQuantity > 0 ? "ON" : "OFF"}
              </Button>
            </div>
            {requiredQuantity > 0 && (
              <QuantityStepper
                value={requiredQuantity}
                onChange={setRequiredQuantity}
                unit={resolvedUnit || undefined}
                min={1}
                size="sm"
                label="常備する数"
                className="mt-1"
              />
            )}
          </div>

          {showDetails ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="barcode">バーコード</Label>
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="スキャンするか手入力"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">メモ</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="購入店、調理予定など"
                  rows={2}
                />
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              バーコード・メモを入力する
            </button>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中…" : isEdit ? "保存" : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
