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
  categoryId?: string | null;
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

export const CATEGORY_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
  "gray",
] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const CATEGORY_COLOR_CLASSES: Record<CategoryColor, string> = {
  red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  orange:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900",
  yellow:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900",
  green:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900",
  blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  purple:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900",
  pink: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900",
  gray: "bg-muted text-muted-foreground border-border",
};

export const DEFAULT_CATEGORIES: ReadonlyArray<{
  name: string;
  color: CategoryColor;
}> = [
  { name: "野菜", color: "green" },
  { name: "肉", color: "red" },
  { name: "魚", color: "blue" },
  { name: "乳製品", color: "yellow" },
  { name: "調味料", color: "orange" },
  { name: "飲料", color: "cyan" },
  { name: "お菓子", color: "pink" },
  { name: "レトルト", color: "purple" },
  { name: "冷凍食品", color: "gray" },
  { name: "その他", color: "gray" },
];

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
