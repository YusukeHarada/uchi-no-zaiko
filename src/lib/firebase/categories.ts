import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getDb } from "./config";
import { fsPath } from "./paths";
import {
  DEFAULT_CATEGORIES,
  type Category,
  type CategoryColor,
} from "@/lib/types/inventory";

export interface CategoryInput {
  name: string;
  color: CategoryColor;
  sortOrder: number;
}

export function subscribeToCategories(
  hid: string,
  callback: (categories: Category[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(
    collection(getDb(), fsPath.categories(hid)),
    orderBy("sortOrder", "asc"),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Category,
      );
      callback(items);
    },
    (error) => {
      console.error("subscribeToCategories error", error);
      onError?.(error);
    },
  );
}

export async function addCategory(
  hid: string,
  input: CategoryInput,
): Promise<string> {
  const ref = await addDoc(collection(getDb(), fsPath.categories(hid)), {
    name: input.name.trim(),
    color: input.color,
    sortOrder: input.sortOrder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(
  hid: string,
  categoryId: string,
  input: Partial<CategoryInput>,
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.color !== undefined) payload.color = input.color;
  if (input.sortOrder !== undefined) payload.sortOrder = input.sortOrder;
  await updateDoc(doc(getDb(), fsPath.category(hid, categoryId)), payload);
}

export async function deleteCategory(
  hid: string,
  categoryId: string,
): Promise<void> {
  await deleteDoc(doc(getDb(), fsPath.category(hid, categoryId)));
}

export async function reorderCategories(
  hid: string,
  orderedIds: string[],
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, fsPath.category(hid, id)), {
      sortOrder: index,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

/**
 * 既存カテゴリが0件の場合のみデフォルトカテゴリを一括投入する。
 * 既に何かあれば何もしない (ユーザーが全削除した状態を尊重)。
 */
export async function ensureDefaultCategories(hid: string): Promise<void> {
  const db = getDb();
  const ref = collection(db, fsPath.categories(hid));
  const existing = await getDocs(query(ref, limit(1)));
  if (!existing.empty) return;

  const batch = writeBatch(db);
  DEFAULT_CATEGORIES.forEach((cat, i) => {
    batch.set(doc(ref), {
      name: cat.name,
      color: cat.color,
      sortOrder: i,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}
