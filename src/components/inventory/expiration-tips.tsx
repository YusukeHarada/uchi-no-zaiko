interface TipItem {
  name: string;
  room: string;
  fridge: string;
  chilled: string;
  frozen: string;
}

const TIPS: { category: string; note?: string; items: TipItem[] }[] = [
  {
    category: "肉",
    note: "鶏肉・ひき肉は特に傷みやすい。加工肉は比較的日持ちする。",
    items: [
      { name: "牛・豚肉（薄切り・切り落とし）", room: "—", fridge: "2〜3日", chilled: "約10日", frozen: "3〜4週間" },
      { name: "牛・豚肉（ブロック・ステーキ）", room: "—", fridge: "3〜4日", chilled: "約2週間", frozen: "約1ヶ月" },
      { name: "鶏肉（むね・もも）", room: "—", fridge: "1〜2日", chilled: "7〜10日", frozen: "2〜4週間" },
      { name: "ひき肉", room: "—", fridge: "1〜2日", chilled: "2〜3日", frozen: "2〜3週間" },
      { name: "ハム・ベーコン・ソーセージ（開封後）", room: "—", fridge: "2〜3日", chilled: "—", frozen: "約1ヶ月" },
      { name: "レバー・ホルモン", room: "—", fridge: "1〜2日", chilled: "1〜2週間", frozen: "2〜3週間" },
    ],
  },
  {
    category: "魚介",
    note: "生鮮魚・刺身は1〜2日が目安。干物は比較的日持ちする。",
    items: [
      { name: "魚の切り身", room: "—", fridge: "1〜2日", chilled: "3〜4日", frozen: "2〜3週間" },
      { name: "丸魚・一尾", room: "—", fridge: "1〜2日", chilled: "2〜3日", frozen: "2〜3週間" },
      { name: "刺身・さく（まぐろ等）", room: "—", fridge: "1〜2日", chilled: "—", frozen: "2〜4週間" },
      { name: "貝類・えび", room: "—", fridge: "1日", chilled: "2〜3日", frozen: "2〜4週間" },
      { name: "いか・たこ", room: "—", fridge: "1〜3日", chilled: "2〜3日", frozen: "2〜3週間" },
      { name: "ひもの・干物", room: "—", fridge: "約3日", chilled: "—", frozen: "1〜2ヶ月" },
    ],
  },
  {
    category: "野菜（葉物）",
    note: "葉物はすぐ鮮度が落ちる。立てて保存すると長持ちしやすい。",
    items: [
      { name: "ほうれん草・小松菜", room: "—", fridge: "3〜5日", chilled: "—", frozen: "約1ヶ月" },
      { name: "レタス", room: "—", fridge: "3〜5日", chilled: "—", frozen: "—" },
      { name: "キャベツ・白菜", room: "—", fridge: "約2週間", chilled: "—", frozen: "2〜3週間" },
      { name: "ねぎ", room: "—", fridge: "約1週間", chilled: "—", frozen: "約1ヶ月" },
      { name: "にら", room: "—", fridge: "2〜3日", chilled: "—", frozen: "約1ヶ月" },
    ],
  },
  {
    category: "野菜（果菜）",
    items: [
      { name: "トマト", room: "数日（未熟時）", fridge: "7〜10日", chilled: "—", frozen: "約1ヶ月" },
      { name: "きゅうり", room: "—", fridge: "約1週間", chilled: "—", frozen: "約1ヶ月" },
      { name: "なす", room: "1〜2日", fridge: "約1週間", chilled: "—", frozen: "約1ヶ月" },
      { name: "ピーマン", room: "—", fridge: "約1週間", chilled: "—", frozen: "約1ヶ月" },
    ],
  },
  {
    category: "野菜（根菜・芋）",
    note: "じゃがいも・玉ねぎ・さつまいもは冷暗所での常温保存が長持ち。",
    items: [
      { name: "じゃがいも", room: "2〜3ヶ月", fridge: "約2ヶ月", chilled: "—", frozen: "約1ヶ月（加熱後）" },
      { name: "玉ねぎ", room: "1〜2ヶ月", fridge: "約2ヶ月", chilled: "—", frozen: "約1ヶ月" },
      { name: "さつまいも", room: "1〜2ヶ月", fridge: "—（低温障害）", chilled: "—", frozen: "約1ヶ月" },
      { name: "にんじん", room: "—（夏は不可）", fridge: "2〜3週間", chilled: "—", frozen: "約1ヶ月" },
      { name: "大根", room: "—", fridge: "10日〜2週間", chilled: "—", frozen: "約1ヶ月" },
      { name: "ごぼう", room: "約1週間（土付き）", fridge: "1〜2週間", chilled: "—", frozen: "約1ヶ月" },
    ],
  },
  {
    category: "野菜（その他）",
    items: [
      { name: "ブロッコリー", room: "—", fridge: "3〜4日", chilled: "—", frozen: "約1ヶ月" },
      { name: "もやし", room: "—", fridge: "2〜3日", chilled: "—", frozen: "約2週間" },
      { name: "きのこ類", room: "—", fridge: "約1週間", chilled: "—", frozen: "約1ヶ月" },
      { name: "アボカド", room: "追熟まで", fridge: "4〜5日", chilled: "—", frozen: "約1ヶ月" },
      { name: "にんにく・しょうが", room: "約1ヶ月", fridge: "約1ヶ月", chilled: "—", frozen: "1〜6ヶ月" },
    ],
  },
  {
    category: "乳製品",
    items: [
      { name: "牛乳（開封後）", room: "—", fridge: "2〜3日", chilled: "3〜4日", frozen: "—" },
      { name: "ヨーグルト（開封後）", room: "—", fridge: "2〜3日", chilled: "3〜5日", frozen: "—" },
      { name: "チーズ（開封後）", room: "—", fridge: "1〜2週間", chilled: "2〜3週間", frozen: "約1ヶ月" },
    ],
  },
];

export function ExpirationTips() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">保存方法のめやす期間について</p>
        <p className="mt-1">
          下記はおおよその目安です。購入日・鮮度・季節・個体差によって異なります。
          においや色など状態をよく確認してからお召し上がりください。
        </p>
        <ul className="mt-2 space-y-0.5">
          <li><span className="font-medium">常温</span>：直射日光を避けた風通しのよい冷暗所</li>
          <li><span className="font-medium">冷蔵庫</span>：約3〜5℃（野菜は野菜室を含む）</li>
          <li><span className="font-medium">チルド室</span>：約0〜2℃。冷蔵より低温で鮮度を保ちやすい</li>
          <li><span className="font-medium">冷凍庫</span>：−18℃以下。長期保存向き、解凍後は早めに使い切る</li>
        </ul>
      </div>

      {TIPS.map((group) => (
        <div key={group.category}>
          <h2 className="mb-1 text-sm font-semibold">{group.category}</h2>
          {group.note && (
            <p className="mb-2 text-xs text-muted-foreground">{group.note}</p>
          )}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">食品</th>
                  <th className="px-3 py-2 font-medium">常温</th>
                  <th className="px-3 py-2 font-medium">冷蔵庫</th>
                  <th className="px-3 py-2 font-medium">チルド室</th>
                  <th className="px-3 py-2 font-medium">冷凍庫</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item, i) => (
                  <tr key={item.name} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2 tabular-nums">{item.room}</td>
                    <td className="px-3 py-2 tabular-nums">{item.fridge}</td>
                    <td className="px-3 py-2 tabular-nums">{item.chilled}</td>
                    <td className="px-3 py-2 tabular-nums">{item.frozen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
