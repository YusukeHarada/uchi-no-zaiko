"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { useCategories } from "@/lib/firebase/categories-context";
import { deleteItem } from "@/lib/firebase/items";
import { formatDate, getExpirationInfo } from "@/lib/expiration";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLOR_CLASSES,
  type InventoryItem,
} from "@/lib/types/inventory";

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
  const expiration = getExpirationInfo(item.expiresAt);
  const isBelowRequired =
    item.requiredQuantity > 0 && item.quantity < item.requiredQuantity;

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
          "card relative flex items-start gap-3 overflow-hidden rounded-xl border bg-card px-4 py-3.5",
        )}
      >
        {/* Left status indicator strip */}
        <div
          className={cn("absolute inset-y-0 left-0 w-0.5 rounded-full", statusBar)}
        />

        <div className="min-w-0 flex-1 pl-1">
          {/* Item name + badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-base font-semibold leading-snug text-foreground">
              {item.name}
            </h3>
            {category && (
              <Badge
                variant="outline"
                className={cn("text-xs font-normal", CATEGORY_COLOR_CLASSES[category.color])}
              >
                {category.name}
              </Badge>
            )}
            {expiration.status === "expired" && (
              <Badge variant="destructive" className="text-xs">
                期限切れ {expiration.label}
              </Badge>
            )}
            {expiration.status === "soon" && (
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
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{item.quantity}</span>
              {item.unit ? ` ${item.unit}` : ""}
              {item.requiredQuantity > 0 && (
                <span className="text-xs text-muted-foreground/70">
                  {" "}/ 必要 {item.requiredQuantity}
                </span>
              )}
            </span>
            {item.expiresAt && (
              <span className="text-xs">
                期限 {formatDate(item.expiresAt)}
              </span>
            )}
          </div>

          {item.note && (
            <p className="mt-1 truncate text-xs text-muted-foreground/70">
              {item.note}
            </p>
          )}
        </div>

        {/* Action buttons — min 44px touch target */}
        <div className="flex shrink-0 gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(item)}
            aria-label="編集"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            aria-label="削除"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>「{item.name}」を削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              削除すると元に戻せません。
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
