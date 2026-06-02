"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryRow } from "@/components/settings/category-row";
import {
  addCategory,
  reorderCategories,
} from "@/lib/firebase/categories";
import { useCategories } from "@/lib/firebase/categories-context";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLORS,
  CATEGORY_COLOR_CLASSES,
  type CategoryColor,
} from "@/lib/types/inventory";

interface Props {
  householdId: string;
}

export function CategorySettingsView({ householdId }: Props) {
  const { categories, loading } = useCategories();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<CategoryColor>("gray");
  const [adding, setAdding] = useState(false);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("名前を入力してください");
      return;
    }
    setAdding(true);
    try {
      const nextSortOrder =
        categories.length > 0
          ? Math.max(...categories.map((c) => c.sortOrder)) + 1
          : 0;
      await addCategory(householdId, {
        name: trimmed,
        color: newColor,
        sortOrder: nextSortOrder,
      });
      setNewName("");
      toast.success("追加しました");
    } catch (error) {
      console.error(error);
      toast.error("追加に失敗しました");
    } finally {
      setAdding(false);
    }
  };

  const swap = async (indexA: number, indexB: number) => {
    if (
      indexA < 0 ||
      indexB < 0 ||
      indexA >= categories.length ||
      indexB >= categories.length
    ) {
      return;
    }
    const next = [...categories];
    const tmp = next[indexA];
    next[indexA] = next[indexB];
    next[indexB] = tmp;
    try {
      await reorderCategories(
        householdId,
        next.map((c) => c.id),
      );
    } catch (error) {
      console.error(error);
      toast.error("並べ替えに失敗しました");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">カテゴリ管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          アイテムを分類するカテゴリを追加・編集できます。
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="space-y-3 rounded-lg border p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
          <div className="space-y-1.5">
            <Label htmlFor="new-name">新しいカテゴリ</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例: パン"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-color">色</Label>
            <Select
              value={newColor}
              onValueChange={(v) => setNewColor(v as CategoryColor)}
            >
              <SelectTrigger id="new-color" className="w-full">
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
          </div>
        </div>
        <Button type="submit" disabled={adding}>
          <Plus /> {adding ? "追加中…" : "追加"}
        </Button>
      </form>

      <div className="space-y-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            読み込み中…
          </p>
        ) : categories.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            カテゴリがありません。上のフォームから追加してください。
          </div>
        ) : (
          categories.map((cat, index) => (
            <CategoryRow
              key={cat.id}
              householdId={householdId}
              category={cat}
              isFirst={index === 0}
              isLast={index === categories.length - 1}
              onMoveUp={() => swap(index, index - 1)}
              onMoveDown={() => swap(index, index + 1)}
            />
          ))
        )}
      </div>
    </div>
  );
}
