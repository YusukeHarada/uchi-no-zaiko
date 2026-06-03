"use client";

import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/lib/firebase/categories-context";
import { addItem, updateItem, type ItemInput } from "@/lib/firebase/items";
import {
  STORAGE_LOCATIONS,
  STORAGE_LOCATION_LABELS,
  type InventoryItem,
  type StorageLocation,
} from "@/lib/types/inventory";

const UNCATEGORIZED = "__none__";

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
  const [name, setName] = useState("");
  const [location, setLocation] = useState<StorageLocation>(defaultLocation);
  const [categoryId, setCategoryId] = useState<string>(UNCATEGORIZED);
  const [quantity, setQuantity] = useState("1");
  const [requiredQuantity, setRequiredQuantity] = useState("0");
  const [unit, setUnit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [barcode, setBarcode] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setName(item.name);
      setLocation(item.location);
      setCategoryId(item.categoryId ?? UNCATEGORIZED);
      setQuantity(String(item.quantity));
      setRequiredQuantity(String(item.requiredQuantity));
      setUnit(item.unit ?? "");
      setExpiresAt(timestampToDateInputValue(item.expiresAt));
      setBarcode(item.barcode ?? "");
      setNote(item.note ?? "");
    } else {
      setName(initialValues?.name ?? "");
      setLocation(defaultLocation);
      setCategoryId(UNCATEGORIZED);
      setQuantity("1");
      setRequiredQuantity("0");
      setUnit("");
      setExpiresAt("");
      setBarcode(initialValues?.barcode ?? "");
      setNote("");
    }
  }, [open, item, defaultLocation, initialValues]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("名前を入力してください");
      return;
    }
    const qty = Number(quantity);
    const req = Number(requiredQuantity);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error("数量は0以上の数値で入力してください");
      return;
    }
    if (Number.isNaN(req) || req < 0) {
      toast.error("必要数は0以上の数値で入力してください");
      return;
    }

    const input: ItemInput = {
      name: name.trim(),
      location,
      categoryId: categoryId === UNCATEGORIZED ? null : categoryId,
      quantity: qty,
      requiredQuantity: req,
      unit: unit.trim() || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "アイテムを編集" : "アイテムを追加"}</DialogTitle>
          <DialogDescription>
            食品の名前と保管場所、数量を入力してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">名前 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 牛肉 (切り落とし)"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location">保管場所 *</Label>
              <Select
                value={location}
                onValueChange={(v) => setLocation(v as StorageLocation)}
              >
                <SelectTrigger id="location" className="w-full">
                  <SelectValue>
                    {(v: StorageLocation | null) =>
                      v ? STORAGE_LOCATION_LABELS[v] : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {STORAGE_LOCATION_LABELS[loc]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">カテゴリ</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => setCategoryId(v ?? UNCATEGORIZED)}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue>
                    {(v: string | null) => {
                      if (!v || v === UNCATEGORIZED) return "未分類";
                      return (
                        categories.find((c) => c.id === v)?.name ?? "未分類"
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNCATEGORIZED}>未分類</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                min={0}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="required">必要数</Label>
              <Input
                id="required"
                type="number"
                inputMode="numeric"
                min={0}
                step="any"
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">単位</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="個 / g"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">賞味期限</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <ExpirationTipsDialog />
          </div>

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
