import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "./config";
import { fsPath } from "./paths";
import { syncShoppingListForItem } from "./shopping";
import type { InventoryItem, StorageLocation } from "@/lib/types/inventory";

export interface ItemInput {
  name: string;
  location: StorageLocation;
  categoryId?: string | null;
  quantity: number;
  requiredQuantity: number;
  unit?: string;
  expiresAt?: Date | null;
  barcode?: string;
  note?: string;
}

function toFirestorePayload(input: ItemInput) {
  return {
    name: input.name.trim(),
    location: input.location,
    categoryId: input.categoryId ?? null,
    quantity: input.quantity,
    requiredQuantity: input.requiredQuantity,
    unit: input.unit?.trim() || null,
    expiresAt: input.expiresAt ? Timestamp.fromDate(input.expiresAt) : null,
    barcode: input.barcode?.trim() || null,
    note: input.note?.trim() || null,
  };
}

export async function addItem(hid: string, input: ItemInput): Promise<string> {
  const ref = await addDoc(collection(getDb(), fsPath.items(hid)), {
    ...toFirestorePayload(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await syncShoppingListForItem(hid, ref.id).catch((err) => {
    console.error("Failed to sync shopping list after addItem", err);
  });
  return ref.id;
}

export async function updateItem(
  hid: string,
  itemId: string,
  input: ItemInput,
): Promise<void> {
  await updateDoc(doc(getDb(), fsPath.item(hid, itemId)), {
    ...toFirestorePayload(input),
    updatedAt: serverTimestamp(),
  });
  await syncShoppingListForItem(hid, itemId).catch((err) => {
    console.error("Failed to sync shopping list after updateItem", err);
  });
}

/**
 * 数量だけをその場で増減する。カード上の +/- ステッパー用。
 *
 * updateItem は ItemInput 全体を書き込むため、家族が同時に編集していると他の
 * フィールドを巻き戻してしまう。増減はトランザクションで quantity と updatedAt
 * だけを触る。0 未満にはならず、0 になってもアイテムは削除しない
 * (「切らし中」として在庫に残り、次回 +1 で復活させられる)。
 *
 * @returns 更新後の数量
 */
export async function adjustItemQuantity(
  hid: string,
  itemId: string,
  delta: number,
): Promise<number> {
  const db = getDb();
  const itemRef = doc(db, fsPath.item(hid, itemId));

  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemRef);
    if (!snap.exists()) {
      throw new Error(`Item not found: ${itemId}`);
    }
    const current = (snap.data().quantity as number | undefined) ?? 0;
    const updated = Math.max(0, current + delta);
    if (updated === current) return current;
    tx.update(itemRef, { quantity: updated, updatedAt: serverTimestamp() });
    return updated;
  });

  await syncShoppingListForItem(hid, itemId).catch((err) => {
    console.error("Failed to sync shopping list after adjustItemQuantity", err);
  });
  return next;
}

export async function deleteItem(hid: string, itemId: string): Promise<void> {
  await deleteDoc(doc(getDb(), fsPath.item(hid, itemId)));
  await syncShoppingListForItem(hid, itemId).catch((err) => {
    console.error("Failed to sync shopping list after deleteItem", err);
  });
}

export function subscribeToItems(
  hid: string,
  callback: (items: InventoryItem[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(
    collection(getDb(), fsPath.items(hid)),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as InventoryItem,
      );
      callback(items);
    },
    (error) => {
      console.error("subscribeToItems error", error);
      onError?.(error);
    },
  );
}
