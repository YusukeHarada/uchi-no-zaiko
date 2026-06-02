"use client";

import { useEffect, useState } from "react";
import { ShoppingListCard } from "@/components/shopping/shopping-list-card";
import { subscribeToShoppingList } from "@/lib/firebase/shopping";
import type { ShoppingListItem } from "@/lib/types/inventory";

interface Props {
  householdId: string;
}

export function ShoppingListView({ householdId }: Props) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToShoppingList(
      householdId,
      (next) => {
        setItems(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [householdId]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">買い物リスト</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          在庫が必要数を下回ったアイテムが自動で追加されます。
        </p>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            読み込み中…
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            買うものはありません 🎉
          </div>
        ) : (
          items.map((item) => (
            <ShoppingListCard
              key={item.id}
              householdId={householdId}
              item={item}
            />
          ))
        )}
      </div>
    </div>
  );
}
