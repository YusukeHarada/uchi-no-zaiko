import type { Timestamp } from "firebase/firestore";

export const STORAGE_LOCATIONS = ["fridge", "freezer", "pantry", "other"] as const;
export type StorageLocation = (typeof STORAGE_LOCATIONS)[number];

export const STORAGE_LOCATION_LABELS: Record<StorageLocation, string> = {
  fridge: "冷蔵庫",
  freezer: "冷凍庫",
  pantry: "棚",
  other: "その他",
};

export interface InventoryItem {
  id: string;
  name: string;
  location: StorageLocation;
  quantity: number;
  requiredQuantity: number;
  unit?: string;
  expiresAt?: Timestamp | null;
  barcode?: string;
  imageUrl?: string;
  note?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  sourceItemId?: string;
  done: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  memberUids: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  defaultHouseholdId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
