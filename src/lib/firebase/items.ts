import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
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
