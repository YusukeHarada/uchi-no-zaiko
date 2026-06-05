"use client";

import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  completePurchase,
  removeShoppingItem,
} from "@/lib/firebase/shopping";
import type { ShoppingListItem } from "@/lib/types/inventory";

interface Props {
  householdId: string;
  item: ShoppingListItem;
}

export function ShoppingListCard({ householdId, item }: Props) {
  const [quantity, setQuantity] = useState(String(item.quantity || 1));
  const [completing, setCompleting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleComplete = async () => {
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("数量は1以上で入力してください");
      return;
    }
    setCompleting(true);
    try {
      await completePurchase(householdId, item.id, qty);
      toast.success(`「${item.name}」を在庫に追加しました`);
    } catch (error) {
      console.error(error);
      toast.error("完了処理に失敗しました");
    } finally {
      setCompleting(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeShoppingItem(householdId, item.id);
      toast.success("買い物リストから削除しました");
    } catch (error) {
      console.error(error);
      toast.error("削除に失敗しました");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{item.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            推奨: {item.quantity}
            {item.unit ? ` ${item.unit}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-11 w-16 text-base"
            aria-label="購入数量"
          />
          {item.unit && (
            <span className="text-sm text-muted-foreground">{item.unit}</span>
          )}
          <Button
            className="h-11 px-4"
            onClick={handleComplete}
            disabled={completing || removing}
          >
            <Check /> 完了
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-11"
            onClick={handleRemove}
            disabled={completing || removing}
            aria-label="削除"
          >
            <Trash2 />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
