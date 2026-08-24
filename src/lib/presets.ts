import type { StorageLocation } from "@/lib/types/inventory";

/**
 * タップだけで在庫を登録するための食材辞書。
 *
 * カテゴリは ID ではなく「名前」で持つ。カテゴリ ID は世帯ごとに採番されるため、
 * 実際の ID は `useCategories()` の一覧から名前一致で解決する
 * (見つからなければ未分類 = null にフォールバックする)。
 *
 * expireDays は「登録した日から数えた目安の日数」。
 * 生鮮品の値は src/components/inventory/expiration-tips.tsx の保存目安テーブルに合わせている。
 * null は「期限を設定しない」を意味する。
 */
export interface FoodPreset {
  name: string;
  categoryName: string;
  location: StorageLocation;
  unit: string;
  expireDays: number | null;
  /** 常備品。切らしたら買い物リストに出したいもの (requiredQuantity = 1 で登録する) */
  staple?: boolean;
}

export const FOOD_PRESETS: readonly FoodPreset[] = [
  // ── 野菜 ────────────────────────────────────────────────
  { name: "キャベツ", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 14 },
  { name: "玉ねぎ", categoryName: "野菜", location: "pantry", unit: "個", expireDays: 30, staple: true },
  { name: "にんじん", categoryName: "野菜", location: "fridge", unit: "本", expireDays: 14, staple: true },
  { name: "じゃがいも", categoryName: "野菜", location: "pantry", unit: "個", expireDays: 30, staple: true },
  { name: "大根", categoryName: "野菜", location: "fridge", unit: "本", expireDays: 10 },
  { name: "白菜", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 10 },
  { name: "レタス", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 5 },
  { name: "トマト", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 7 },
  { name: "きゅうり", categoryName: "野菜", location: "fridge", unit: "本", expireDays: 5 },
  { name: "なす", categoryName: "野菜", location: "fridge", unit: "本", expireDays: 5 },
  { name: "ピーマン", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 7 },
  { name: "ブロッコリー", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 5 },
  { name: "ほうれん草", categoryName: "野菜", location: "fridge", unit: "袋", expireDays: 4 },
  { name: "小松菜", categoryName: "野菜", location: "fridge", unit: "袋", expireDays: 4 },
  { name: "もやし", categoryName: "野菜", location: "fridge", unit: "袋", expireDays: 3 },
  { name: "長ねぎ", categoryName: "野菜", location: "fridge", unit: "本", expireDays: 10 },
  { name: "しめじ", categoryName: "野菜", location: "fridge", unit: "袋", expireDays: 5 },
  { name: "えのき", categoryName: "野菜", location: "fridge", unit: "袋", expireDays: 5 },
  { name: "しいたけ", categoryName: "野菜", location: "fridge", unit: "パック", expireDays: 5 },
  { name: "にんにく", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 30 },
  { name: "しょうが", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 21 },
  { name: "さつまいも", categoryName: "野菜", location: "pantry", unit: "本", expireDays: 30 },
  { name: "かぼちゃ", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 10 },
  { name: "ごぼう", categoryName: "野菜", location: "fridge", unit: "本", expireDays: 14 },
  { name: "アボカド", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 5 },
  { name: "バナナ", categoryName: "野菜", location: "pantry", unit: "房", expireDays: 5 },
  { name: "りんご", categoryName: "野菜", location: "fridge", unit: "個", expireDays: 21 },
  { name: "みかん", categoryName: "野菜", location: "pantry", unit: "個", expireDays: 10 },

  // ── 肉 ──────────────────────────────────────────────────
  { name: "鶏むね肉", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 2 },
  { name: "鶏もも肉", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 2 },
  { name: "鶏ささみ", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 2 },
  { name: "豚こま切れ", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 3 },
  { name: "豚バラ肉", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 3 },
  { name: "豚ロース", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 3 },
  { name: "牛切り落とし", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 3 },
  { name: "合いびき肉", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 2 },
  { name: "鶏ひき肉", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 2 },
  { name: "ベーコン", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 14 },
  { name: "ウインナー", categoryName: "肉", location: "fridge", unit: "袋", expireDays: 14 },
  { name: "ハム", categoryName: "肉", location: "fridge", unit: "パック", expireDays: 10 },

  // ── 魚 ──────────────────────────────────────────────────
  { name: "鮭", categoryName: "魚", location: "fridge", unit: "切れ", expireDays: 2 },
  { name: "さば", categoryName: "魚", location: "fridge", unit: "切れ", expireDays: 2 },
  { name: "ぶり", categoryName: "魚", location: "fridge", unit: "切れ", expireDays: 2 },
  { name: "たら", categoryName: "魚", location: "fridge", unit: "切れ", expireDays: 2 },
  { name: "まぐろ", categoryName: "魚", location: "fridge", unit: "パック", expireDays: 1 },
  { name: "えび", categoryName: "魚", location: "fridge", unit: "パック", expireDays: 1 },
  { name: "いか", categoryName: "魚", location: "fridge", unit: "パック", expireDays: 2 },
  { name: "しらす", categoryName: "魚", location: "fridge", unit: "パック", expireDays: 4 },
  { name: "ちくわ", categoryName: "魚", location: "fridge", unit: "袋", expireDays: 10 },
  { name: "かまぼこ", categoryName: "魚", location: "fridge", unit: "本", expireDays: 14 },

  // ── 乳製品 ──────────────────────────────────────────────
  { name: "牛乳", categoryName: "乳製品", location: "fridge", unit: "本", expireDays: 7, staple: true },
  { name: "卵", categoryName: "乳製品", location: "fridge", unit: "パック", expireDays: 14, staple: true },
  { name: "ヨーグルト", categoryName: "乳製品", location: "fridge", unit: "個", expireDays: 10 },
  { name: "スライスチーズ", categoryName: "乳製品", location: "fridge", unit: "袋", expireDays: 30 },
  { name: "ピザ用チーズ", categoryName: "乳製品", location: "fridge", unit: "袋", expireDays: 21 },
  { name: "バター", categoryName: "乳製品", location: "fridge", unit: "個", expireDays: 60, staple: true },
  { name: "生クリーム", categoryName: "乳製品", location: "fridge", unit: "本", expireDays: 7 },
  { name: "豆乳", categoryName: "乳製品", location: "fridge", unit: "本", expireDays: 14 },

  // ── 調味料 ──────────────────────────────────────────────
  { name: "醤油", categoryName: "調味料", location: "fridge", unit: "本", expireDays: null, staple: true },
  { name: "味噌", categoryName: "調味料", location: "fridge", unit: "個", expireDays: null, staple: true },
  { name: "塩", categoryName: "調味料", location: "pantry", unit: "袋", expireDays: null, staple: true },
  { name: "砂糖", categoryName: "調味料", location: "pantry", unit: "袋", expireDays: null, staple: true },
  { name: "酢", categoryName: "調味料", location: "pantry", unit: "本", expireDays: null },
  { name: "みりん", categoryName: "調味料", location: "pantry", unit: "本", expireDays: null, staple: true },
  { name: "料理酒", categoryName: "調味料", location: "pantry", unit: "本", expireDays: null, staple: true },
  { name: "サラダ油", categoryName: "調味料", location: "pantry", unit: "本", expireDays: null, staple: true },
  { name: "ごま油", categoryName: "調味料", location: "pantry", unit: "本", expireDays: null },
  { name: "オリーブオイル", categoryName: "調味料", location: "pantry", unit: "本", expireDays: null },
  { name: "マヨネーズ", categoryName: "調味料", location: "fridge", unit: "本", expireDays: 60, staple: true },
  { name: "ケチャップ", categoryName: "調味料", location: "fridge", unit: "本", expireDays: 60 },
  { name: "ソース", categoryName: "調味料", location: "fridge", unit: "本", expireDays: 90 },
  { name: "ポン酢", categoryName: "調味料", location: "fridge", unit: "本", expireDays: 60 },
  { name: "めんつゆ", categoryName: "調味料", location: "fridge", unit: "本", expireDays: 30 },
  { name: "だしの素", categoryName: "調味料", location: "pantry", unit: "袋", expireDays: null, staple: true },
  { name: "コンソメ", categoryName: "調味料", location: "pantry", unit: "箱", expireDays: null },
  { name: "鶏がらスープの素", categoryName: "調味料", location: "pantry", unit: "個", expireDays: null },
  { name: "カレールー", categoryName: "調味料", location: "pantry", unit: "箱", expireDays: null },
  { name: "こしょう", categoryName: "調味料", location: "pantry", unit: "個", expireDays: null },
  { name: "片栗粉", categoryName: "調味料", location: "pantry", unit: "袋", expireDays: null },
  { name: "小麦粉", categoryName: "調味料", location: "pantry", unit: "袋", expireDays: null },
  { name: "パン粉", categoryName: "調味料", location: "pantry", unit: "袋", expireDays: null },

  // ── 飲料 ────────────────────────────────────────────────
  { name: "水", categoryName: "飲料", location: "pantry", unit: "本", expireDays: null, staple: true },
  { name: "炭酸水", categoryName: "飲料", location: "pantry", unit: "本", expireDays: null },
  { name: "麦茶", categoryName: "飲料", location: "fridge", unit: "本", expireDays: 7 },
  { name: "緑茶", categoryName: "飲料", location: "pantry", unit: "袋", expireDays: null },
  { name: "コーヒー", categoryName: "飲料", location: "pantry", unit: "袋", expireDays: null },
  { name: "オレンジジュース", categoryName: "飲料", location: "fridge", unit: "本", expireDays: 14 },
  { name: "ビール", categoryName: "飲料", location: "fridge", unit: "本", expireDays: null },

  // ── お菓子 ──────────────────────────────────────────────
  { name: "ポテトチップス", categoryName: "お菓子", location: "pantry", unit: "袋", expireDays: null },
  { name: "チョコレート", categoryName: "お菓子", location: "pantry", unit: "個", expireDays: null },
  { name: "クッキー", categoryName: "お菓子", location: "pantry", unit: "袋", expireDays: null },
  { name: "せんべい", categoryName: "お菓子", location: "pantry", unit: "袋", expireDays: null },
  { name: "アイス", categoryName: "お菓子", location: "freezer", unit: "個", expireDays: null },
  { name: "グミ", categoryName: "お菓子", location: "pantry", unit: "袋", expireDays: null },
  { name: "ヨーグルト飲料", categoryName: "お菓子", location: "fridge", unit: "本", expireDays: 14 },

  // ── レトルト ────────────────────────────────────────────
  { name: "レトルトカレー", categoryName: "レトルト", location: "pantry", unit: "袋", expireDays: null },
  { name: "パスタソース", categoryName: "レトルト", location: "pantry", unit: "袋", expireDays: null },
  { name: "インスタントラーメン", categoryName: "レトルト", location: "pantry", unit: "袋", expireDays: null },
  { name: "カップ麺", categoryName: "レトルト", location: "pantry", unit: "個", expireDays: null },
  { name: "レトルトごはん", categoryName: "レトルト", location: "pantry", unit: "個", expireDays: null },
  { name: "ツナ缶", categoryName: "レトルト", location: "pantry", unit: "缶", expireDays: null, staple: true },
  { name: "トマト缶", categoryName: "レトルト", location: "pantry", unit: "缶", expireDays: null },
  { name: "コーン缶", categoryName: "レトルト", location: "pantry", unit: "缶", expireDays: null },
  { name: "サバ缶", categoryName: "レトルト", location: "pantry", unit: "缶", expireDays: null },
  { name: "味噌汁の素", categoryName: "レトルト", location: "pantry", unit: "袋", expireDays: null },

  // ── 冷凍食品 ────────────────────────────────────────────
  { name: "冷凍餃子", categoryName: "冷凍食品", location: "freezer", unit: "袋", expireDays: 90 },
  { name: "冷凍うどん", categoryName: "冷凍食品", location: "freezer", unit: "袋", expireDays: 90, staple: true },
  { name: "冷凍からあげ", categoryName: "冷凍食品", location: "freezer", unit: "袋", expireDays: 90 },
  { name: "冷凍ブロッコリー", categoryName: "冷凍食品", location: "freezer", unit: "袋", expireDays: 90 },
  { name: "冷凍ミックスベジタブル", categoryName: "冷凍食品", location: "freezer", unit: "袋", expireDays: 90 },
  { name: "冷凍チャーハン", categoryName: "冷凍食品", location: "freezer", unit: "袋", expireDays: 90 },
  { name: "冷凍ごはん", categoryName: "冷凍食品", location: "freezer", unit: "個", expireDays: 30 },
  { name: "アイスキューブ", categoryName: "冷凍食品", location: "freezer", unit: "袋", expireDays: null },

  // ── その他 ──────────────────────────────────────────────
  { name: "米", categoryName: "その他", location: "pantry", unit: "kg", expireDays: null, staple: true },
  { name: "食パン", categoryName: "その他", location: "pantry", unit: "斤", expireDays: 4, staple: true },
  { name: "豆腐", categoryName: "その他", location: "fridge", unit: "丁", expireDays: 5 },
  { name: "納豆", categoryName: "その他", location: "fridge", unit: "パック", expireDays: 10 },
  { name: "油揚げ", categoryName: "その他", location: "fridge", unit: "袋", expireDays: 7 },
  { name: "パスタ", categoryName: "その他", location: "pantry", unit: "袋", expireDays: null, staple: true },
  { name: "うどん", categoryName: "その他", location: "fridge", unit: "袋", expireDays: 14 },
  { name: "そば", categoryName: "その他", location: "pantry", unit: "袋", expireDays: null },
  { name: "こんにゃく", categoryName: "その他", location: "fridge", unit: "個", expireDays: 30 },
  { name: "わかめ", categoryName: "その他", location: "pantry", unit: "袋", expireDays: null },
  { name: "海苔", categoryName: "その他", location: "pantry", unit: "袋", expireDays: null },
  { name: "ごま", categoryName: "その他", location: "pantry", unit: "袋", expireDays: null },
];

/** 単位のタップ候補。「その他」を選ぶと自由入力にフォールバックする */
export const UNIT_PRESETS = [
  "個",
  "本",
  "袋",
  "パック",
  "枚",
  "缶",
  "g",
  "ml",
  "丁",
  "切れ",
] as const;

/** 賞味期限のタップ候補。days は「今日から何日後か」 */
export const EXPIRY_PRESETS = [
  { label: "今日", days: 0 },
  { label: "明日", days: 1 },
  { label: "3日", days: 3 },
  { label: "1週間", days: 7 },
  { label: "2週間", days: 14 },
  { label: "1ヶ月", days: 30 },
  { label: "3ヶ月", days: 90 },
] as const;

/** base から days 日後のローカル深夜 0 時を返す */
export function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

/** 名前の表記ゆれを吸収して突き合わせるためのキー */
export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}
