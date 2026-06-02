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
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <>
      <Card>
        <CardContent className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold">{item.name}</h3>
              {category && (
                <Badge
                  variant="outline"
                  className={cn(CATEGORY_COLOR_CLASSES[category.color])}
                >
                  {category.name}
                </Badge>
              )}
              {expiration.status === "expired" && (
                <Badge variant="destructive">期限切れ {expiration.label}</Badge>
              )}
              {expiration.status === "soon" && (
                <Badge className="bg-amber-500 text-white">{expiration.label}</Badge>
              )}
              {expiration.status === "ok" && (
                <Badge variant="secondary">{expiration.label}</Badge>
              )}
              {isBelowRequired && <Badge variant="outline">在庫不足</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                <span className="text-foreground font-medium">{item.quantity}</span>
                {item.unit ? ` ${item.unit}` : ""}
                {item.requiredQuantity > 0 ? ` / 必要 ${item.requiredQuantity}` : ""}
              </span>
              {item.expiresAt && <span>期限 {formatDate(item.expiresAt)}</span>}
            </div>
            {item.note && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {item.note}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
              aria-label="編集"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmOpen(true)}
              aria-label="削除"
            >
              <Trash2 />
            </Button>
          </div>
        </CardContent>
      </Card>

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
