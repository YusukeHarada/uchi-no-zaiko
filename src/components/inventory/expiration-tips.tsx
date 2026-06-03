const TIPS = [
  {
    category: "肉",
    items: [
      { name: "牛・豚肉（薄切り・切り落とし）", fridge: "2〜3日", chilled: "4〜5日", frozen: "約1ヶ月" },
      { name: "鶏肉", fridge: "1〜2日", chilled: "3〜4日", frozen: "約1ヶ月" },
      { name: "ひき肉", fridge: "1〜2日", chilled: "2〜3日", frozen: "2〜3週間" },
      { name: "ブロック肉", fridge: "3〜4日", chilled: "5〜7日", frozen: "約2ヶ月" },
    ],
  },
  {
    category: "魚介",
    items: [
      { name: "魚の切り身", fridge: "1〜2日", chilled: "3〜4日", frozen: "約2週間" },
      { name: "丸魚・一尾", fridge: "1〜2日", chilled: "2〜3日", frozen: "約2週間" },
      { name: "貝類・えび", fridge: "1日", chilled: "2〜3日", frozen: "約1ヶ月" },
      { name: "いか・たこ", fridge: "1〜2日", chilled: "2〜3日", frozen: "約1ヶ月" },
    ],
  },
  {
    category: "野菜",
    items: [
      { name: "葉物野菜（ほうれん草・小松菜など）", fridge: "3〜5日", chilled: "—", frozen: "約1ヶ月" },
      { name: "根菜類（にんじん・大根など）", fridge: "1〜2週間", chilled: "—", frozen: "約1ヶ月" },
      { name: "キノコ類", fridge: "3〜5日", chilled: "—", frozen: "約1ヶ月" },
    ],
  },
  {
    category: "乳製品",
    items: [
      { name: "牛乳（開封後）", fridge: "2〜3日", chilled: "3〜4日", frozen: "—" },
      { name: "ヨーグルト（開封後）", fridge: "2〜3日", chilled: "3〜5日", frozen: "—" },
      { name: "チーズ（開封後）", fridge: "1〜2週間", chilled: "2〜3週間", frozen: "約1ヶ月" },
    ],
  },
];

export function ExpirationTips() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">保存方法のめやす期間について</p>
        <p className="mt-1">
          下記はおおよその目安です。購入日・鮮度・個体差によって異なります。
          においや色など状態をよく確認してからお召し上がりください。
        </p>
        <ul className="mt-2 space-y-0.5">
          <li><span className="font-medium">冷蔵庫</span>：約3〜5℃</li>
          <li><span className="font-medium">チルド室</span>：約0〜2℃。冷蔵より低温で鮮度を保ちやすい</li>
          <li><span className="font-medium">冷凍庫</span>：−18℃以下。長期保存向き、解凍後は早めに使い切る</li>
        </ul>
      </div>

      {TIPS.map((group) => (
        <div key={group.category}>
          <h2 className="mb-2 text-sm font-semibold">{group.category}</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">食品</th>
                  <th className="px-3 py-2 font-medium">冷蔵庫</th>
                  <th className="px-3 py-2 font-medium">チルド室</th>
                  <th className="px-3 py-2 font-medium">冷凍庫</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item, i) => (
                  <tr key={item.name} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                    <td className="px-3 py-2">{item.name}</td>
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
