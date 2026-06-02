import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "カテゴリ別に管理",
    description: "冷蔵庫・冷凍庫・棚など、保管場所ごとに整理できます。",
    detail: "食品をカテゴリに分けて登録・表示。カテゴリ名はカスタマイズでき、自分の家の棚構成に合わせて管理できます。",
  },
  {
    title: "賞味期限アラート",
    description: "期限が近づいた食品をひと目で把握。通知でお知らせも。",
    detail: "賞味期限を登録しておくと、期限が近い食品が一覧上部にハイライト表示されます。食品ロスの防止に役立ちます。",
  },
  {
    title: "必要数 → 買い物リスト",
    description: "在庫が必要数を下回ったら、買い物リストに自動で追加。",
    detail: "食品ごとに「必要数」を設定できます。在庫数が必要数を下回ると在庫不足として表示され、補充のタイミングがひと目でわかります。",
  },
  {
    title: "バーコードでサッと登録",
    description: "スマホのカメラで商品バーコードを読み取って登録。",
    detail: "商品のバーコードをカメラで読み取ると、商品名を自動入力。一から名前を打ち込む手間なく、素早く在庫を追加できます。",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-28">
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          家庭の食品在庫を、もっとシンプルに
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          うちの在庫
        </h1>
        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          冷蔵庫の牛肉も、棚のレトルト食品も。
          家にある食品の在庫数・賞味期限・必要数をまとめて管理できるアプリです。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/inventory" className={buttonVariants({ size: "lg" })}>
            在庫を見る
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            ログイン
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {feature.detail}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
