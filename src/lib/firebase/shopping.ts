import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDb } from "./config";
import { fsPath } from "./paths";
import type {
  InventoryItem,
  ShoppingListItem,
} from "@/lib/types/inventory";

export function subscribeToShoppingList(
  hid: string,
  callback: (items: ShoppingListItem[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(
    collection(getDb(), fsPath.shoppingList(hid)),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as ShoppingListItem,
      );
      callback(items);
    },
    (error) => {
      console.error("subscribeToShoppingList error", error);
      onError?.(error);
    },
  );
}

/**
 * 在庫アイテムの requiredQuantity / quantity に合わせて、対応する買い物リストアイテムを
 * 追加 / 更新 / 削除する。買い物リストアイテムの ID は元の在庫アイテム ID と同じ。
 * 在庫アイテムが削除されている場合は、買い物リストアイテムも削除する。
 */
export async function syncShoppingListForItem(
  hid: string,
  itemId: string,
): Promise<void> {
  const db = getDb();
  const itemRef = doc(db, fsPath.item(hid, itemId));
  const shoppingRef = doc(db, fsPath.shoppingListItem(hid, itemId));

  await runTransaction(db, async (tx) => {
    const itemSnap = await tx.get(itemRef);
    const shoppingSnap = await tx.get(shoppingRef);

    if (!itemSnap.exists()) {
      if (shoppingSnap.exists()) tx.delete(shoppingRef);
      return;
    }

    const item = itemSnap.data() as InventoryItem;
    const required = item.requiredQuantity ?? 0;
    const quantity = item.quantity ?? 0;
    const shouldExist = required > 0 && quantity < required;
    const needed = Math.max(required - quantity, 0);

    if (!shouldExist) {
      if (shoppingSnap.exists()) tx.delete(shoppingRef);
      return;
    }

    if (shoppingSnap.exists()) {
      const existing = shoppingSnap.data() as ShoppingListItem;
      if (existing.quantity === needed && existing.name === item.name) return;
      tx.update(shoppingRef, {
        name: item.name,
        quantity: needed,
        unit: item.unit ?? null,
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(shoppingRef, {
        name: item.name,
        quantity: needed,
        unit: item.unit ?? null,
        sourceItemId: itemId,
        done: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/**
 * 買い物完了: 対応する在庫アイテムに数量を加算し、買い物リストアイテムを削除する。
 * 加算後に再度同期が必要な場合 (まだ足りないなど) は、呼び出し側で syncShoppingListForItem を呼ぶ。
 */
export async function completePurchase(
  hid: string,
  shoppingItemId: string,
  addQuantity: number,
): Promise<void> {
  if (addQuantity <= 0) {
    await deleteDoc(doc(getDb(), fsPath.shoppingListItem(hid, shoppingItemId)));
    return;
  }

  const db = getDb();
  const shoppingRef = doc(db, fsPath.shoppingListItem(hid, shoppingItemId));
  const itemRef = doc(db, fsPath.item(hid, shoppingItemId));

  await runTransaction(db, async (tx) => {
    const itemSnap = await tx.get(itemRef);
    if (itemSnap.exists()) {
      const currentQty = (itemSnap.data().quantity as number | undefined) ?? 0;
      tx.update(itemRef, {
        quantity: currentQty + addQuantity,
        updatedAt: serverTimestamp(),
      });
    }
    tx.delete(shoppingRef);
  });

  // 加算後にまだ必要数を下回っていれば再度買い物リストへ復活させる
  await syncShoppingListForItem(hid, shoppingItemId);
}

export async function removeShoppingItem(
  hid: string,
  shoppingItemId: string,
): Promise<void> {
  await deleteDoc(doc(getDb(), fsPath.shoppingListItem(hid, shoppingItemId)));
}

export async function getInventoryItem(
  hid: string,
  itemId: string,
): Promise<InventoryItem | null> {
  const snap = await getDoc(doc(getDb(), fsPath.item(hid, itemId)));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as InventoryItem;
}

export async function upsertShoppingItem(
  hid: string,
  shoppingItemId: string,
  data: Partial<Omit<ShoppingListItem, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  await setDoc(
    doc(getDb(), fsPath.shoppingListItem(hid, shoppingItemId)),
    {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
