"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteCategory, updateCategory } from "@/lib/firebase/categories";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLORS,
  CATEGORY_COLOR_CLASSES,
  type Category,
  type CategoryColor,
} from "@/lib/types/inventory";

interface Props {
  householdId: string;
  category: Category;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function CategoryRow({
  householdId,
  category,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState<CategoryColor>(category.color);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(category.name);
    setColor(category.color);
  }, [category.name, category.color]);

  const commitName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(category.name);
      return;
    }
    if (trimmed === category.name) return;
    try {
      await updateCategory(householdId, category.id, { name: trimmed });
    } catch (error) {
      console.error(error);
      toast.error("名前の更新に失敗しました");
      setName(category.name);
    }
  };

  const commitColor = async (next: CategoryColor) => {
    setColor(next);
    if (next === category.color) return;
    try {
      await updateCategory(householdId, category.id, { color: next });
    } catch (error) {
      console.error(error);
      toast.error("色の更新に失敗しました");
      setColor(category.color);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCategory(householdId, category.id);
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
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <span
            className={cn(
              "inline-block size-4 shrink-0 rounded-full border",
              CATEGORY_COLOR_CLASSES[color],
            )}
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            className="h-8 min-w-0 flex-1"
            aria-label="カテゴリ名"
          />
          <Select
            value={color}
            onValueChange={(v) => commitColor(v as CategoryColor)}
          >
            <SelectTrigger className="h-8 w-24" aria-label="色">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_COLORS.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block size-3 rounded-full border",
                        CATEGORY_COLOR_CLASSES[c],
                      )}
                    />
                    {c}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="上へ"
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="下へ"
            >
              <ChevronDown />
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
            <AlertDialogTitle>
              「{category.name}」を削除しますか?
            </AlertDialogTitle>
            <AlertDialogDescription>
              このカテゴリを使っているアイテムは「未分類」になります。
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
