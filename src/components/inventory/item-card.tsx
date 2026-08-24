"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useCategories } from "@/lib/firebase/categories-context";
import { adjustItemQuantity, deleteItem } from "@/lib/firebase/items";
import { formatDate, getExpirationInfo } from "@/lib/expiration";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLOR_CLASSES,
  type InventoryItem,
} from "@/lib/types/inventory";

/** 連打を1回の書き込みにまとめる待ち時間 (ms) */
const FLUSH_DELAY = 600;

interface Props {
  item: InventoryItem;
  householdId: string;
  onEdit: (item: InventoryItem) => void;
}

export function ItemCard({ item, householdId, onEdit }: Props) {
  const { byId } = useCategories();
  const category = item.categoryId ? byId.get(item.categoryId) : null;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ステッパーの楽観更新。押した瞬間は pendingDelta で見た目を動かし、
  // FLUSH_DELAY 後に合算した差分を 1 回だけ Firestore に送る。
  // (subscribeToItems は updatedAt 降順なので、1タップ1書き込みだと
  //  「更新が新しい順」表示中にカードが跳ね回ってしまう)
  const [pendingDelta, setPendingDelta] = useState(0);
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const delta = pendingRef.current;
    pendingRef.current = 0;
    timerRef.current = null;
    if (delta === 0) {
      setPendingDelta(0);
      return;
    }
    try {
      await adjustItemQuantity(householdId, item.id, delta);
    } catch (error) {
      console.error(error);
      toast.error("数量の更新に失敗しました");
    } finally {
      // Firestore SDK はローカル書き込みを即座に onSnapshot に反映するので、
      // ここで打ち消しても値が戻って見えることはない
      setPendingDelta((current) => current - delta);
    }
  }, [householdId, item.id]);

  // アンマウント時に未送信の差分を取りこぼさない
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        void flush();
      }
    };
  }, [flush]);

  const displayQuantity = Math.max(0, item.quantity + pendingDelta);

  const handleQuantityChange = (next: number) => {
    const delta = next - displayQuantity;
    if (delta === 0) return;
    pendingRef.current += delta;
    setPendingDelta((current) => current + delta);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(), FLUSH_DELAY);
  };

  const expiration = getExpirationInfo(item.expiresAt, new Date(), category?.name);
  const isOutOfStock = displayQuantity <= 0;
  const isBelowRequired =
    !isOutOfStock &&
    item.requiredQuantity > 0 &&
    displayQuantity < item.requiredQuantity;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(householdId, item.id);
      toast.success("削除しました");
      setConfirmOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  const statusBar =
    expiration.status === "expired"
      ? "bg-destructive"
      : expiration.status === "soon"
        ? "bg-amber-400"
        : "bg-transparent";

  return (
    <>
      <div
        className={cn(
          "card relative overflow-hidden rounded-xl border bg-card px-4 py-3.5",
          isOutOfStock && "opacity-70",
        )}
      >
        {/* Left status indicator strip */}
        <div
          className={cn("absolute inset-y-0 left-0 w-0.5 rounded-full", statusBar)}
        />

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 pl-1">
            {/* Item name + badges row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-base font-semibold leading-snug text-foreground">
                {item.name}
              </h3>
              {isOutOfStock && (
                <Badge variant="outline" className="text-[11px] text-muted-foreground">
                  切らし中
                </Badge>
              )}
              {category && (
                <Badge
                  variant="outline"
                  className={cn("text-xs font-normal", CATEGORY_COLOR_CLASSES[category.color])}
                >
                  {category.name}
                </Badge>
              )}
              {!isOutOfStock && expiration.status === "expired" && (
                <Badge variant="destructive" className="text-xs">
                  期限切れ {expiration.label}
                </Badge>
              )}
              {!isOutOfStock && expiration.status === "soon" && (
                <Badge className="bg-amber-500 text-[11px] text-white hover:bg-amber-500">
                  {expiration.label}
                </Badge>
              )}
              {isBelowRequired && (
                <Badge variant="outline" className="border-orange-300 text-[11px] text-orange-600 dark:text-orange-400">
                  在庫不足
                </Badge>
              )}
            </div>

            {/* Meta row */}
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {item.expiresAt && <span>期限 {formatDate(item.expiresAt)}</span>}
              {item.requiredQuantity > 0 && (
                <span>常備 {item.requiredQuantity}{item.unit ?? ""}</span>
              )}
              {item.note && (
                <span className="truncate text-muted-foreground/70">{item.note}</span>
              )}
            </div>
          </div>

          {/* Action buttons — min 44px touch target */}
          <div className="flex shrink-0 gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(item)}
              aria-label={`${item.name} を編集`}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
              aria-label={`${item.name} を削除`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* タップだけで増減できるステッパー。ダイアログを開かずに「使った / 買った」を反映する */}
        <div className="mt-2 pl-1">
          <QuantityStepper
            value={displayQuantity}
            onChange={handleQuantityChange}
            unit={item.unit}
            label={`${item.name} の数量`}
          />
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>「{item.name}」を削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              削除すると元に戻せません。使い切っただけなら数量を 0 のままにしておくと、
              次に買ったとき + を押すだけで戻せます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "削除中…" : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
