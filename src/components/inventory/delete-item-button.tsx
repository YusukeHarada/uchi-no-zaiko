"use client";

import { Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { deleteItem } from "@/lib/firebase/items";
import type { InventoryItem } from "@/lib/types/inventory";

interface Props {
  householdId: string;
  item: Pick<InventoryItem, "id" | "name">;
  /** icon = カード上のゴミ箱ボタン / text = 編集シートのフッター */
  variant?: "icon" | "text";
  onDeleted?: () => void;
}

/**
 * 確認ダイアログ付きの削除ボタン。
 * コンパクト表示の行にはボタンを置く余白がないため、編集シートからも使えるよう切り出してある。
 */
export function DeleteItemButton({
  householdId,
  item,
  variant = "icon",
  onDeleted,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(householdId, item.id);
      toast.success("削除しました");
      setConfirmOpen(false);
      onDeleted?.();
    } catch (error) {
      console.error(error);
      toast.error("削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-11 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
          aria-label={`${item.name} を削除`}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive sm:mr-auto"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4" /> 削除
        </Button>
      )}

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
