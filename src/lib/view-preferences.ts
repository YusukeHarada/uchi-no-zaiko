/** 在庫一覧の表示密度。compact = 1行、detailed = 従来のカード */
export type InventoryDensity = "compact" | "detailed";

const DENSITY_KEY = "uchi-no-zaiko:inventory-density";

export function getInventoryDensity(): InventoryDensity {
  if (typeof window === "undefined") return "compact";
  try {
    const saved = window.localStorage.getItem(DENSITY_KEY);
    return saved === "detailed" ? "detailed" : "compact";
  } catch {
    return "compact";
  }
}

export function setInventoryDensity(density: InventoryDensity): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DENSITY_KEY, density);
  } catch {
    /* noop */
  }
}
