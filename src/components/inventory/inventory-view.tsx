"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/inventory/item-card";
import { ItemFormDialog } from "@/components/inventory/item-form-dialog";
import { subscribeToItems } from "@/lib/firebase/items";
import {
  STORAGE_LOCATIONS,
  STORAGE_LOCATION_LABELS,
  type InventoryItem,
  type StorageLocation,
} from "@/lib/types/inventory";

interface Props {
  householdId: string;
}

const TAB_VALUES = ["all", ...STORAGE_LOCATIONS] as const;
type TabValue = (typeof TAB_VALUES)[number];

export function InventoryView({ householdId }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToItems(
      householdId,
      (next) => {
        setItems(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [householdId]);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((i) => i.location === tab);
  }, [items, tab]);

  const countByLocation = useMemo(() => {
    const map = new Map<StorageLocation, number>();
    for (const loc of STORAGE_LOCATIONS) map.set(loc, 0);
    for (const item of items) {
      map.set(item.location, (map.get(item.location) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setFormOpen(true);
  };

  const defaultLocation: StorageLocation =
    tab === "all" ? "fridge" : (tab as StorageLocation);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">在庫</h1>
        <Button onClick={openCreate}>
          <Plus /> 追加
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all">すべて ({items.length})</TabsTrigger>
          {STORAGE_LOCATIONS.map((loc) => (
            <TabsTrigger key={loc} value={loc}>
              {STORAGE_LOCATION_LABELS[loc]} ({countByLocation.get(loc) ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_VALUES.map((value) => (
          <TabsContent key={value} value={value} className="mt-4 space-y-2">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                読み込み中…
              </p>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                アイテムがありません。「追加」から登録できます。
              </div>
            ) : (
              filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  householdId={householdId}
                  onEdit={openEdit}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ItemFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        householdId={householdId}
        item={editing}
        defaultLocation={defaultLocation}
      />
    </div>
  );
}
