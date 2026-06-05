import { Bell, Layers, ScanLine, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const features = [
  {
    icon: Layers,
    title: "カテゴリ別に管理",
    description: "冷蔵庫・冷凍庫・棚など、保管場所ごとに整理。カテゴリ名はカスタマイズでき、自分の家の棚構成に合わせて管理できます。",
  },
  {
    icon: Bell,
    title: "賞味期限アラート",
    description: "期限が近い食品をハイライト表示。通知機能で食品ロスを防ぎ、毎日の食材管理をサポートします。",
  },
  {
    icon: ShoppingCart,
    title: "自動買い物リスト",
    description: "在庫が必要数を下回ると自動で買い物リストに追加。補充のタイミングをひと目で把握できます。",
  },
  {
    icon: ScanLine,
    title: "バーコードで即登録",
    description: "スマホのカメラで商品バーコードを読み取り、商品名を自動入力。手入力の手間なく素早く在庫を追加。",
  },
];

export default function Home() {
  return (
    <main className="flex-1 overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-6 py-24 text-center sm:py-36">

        {/* Decorative top badge */}
        <div className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-medium tracking-wide text-primary">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          家庭の食品在庫管理アプリ
        </div>

        {/* Main heading — Noto Serif JP */}
        <div className="flex flex-col items-center gap-4">
          <h1
            className="text-balance text-6xl font-bold leading-tight tracking-tight sm:text-8xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            うちの在庫
          </h1>

          {/* Decorative rule */}
          <div className="flex items-center gap-3 text-primary/35">
            <div className="h-px w-20 bg-current" />
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="rotate-45 opacity-70">
              <rect width="8" height="8" />
            </svg>
            <div className="h-px w-20 bg-current" />
          </div>
        </div>

        {/* Subtitle */}
        <p className="max-w-lg text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          冷蔵庫の牛肉も、棚のレトルト食品も。<br className="hidden sm:block" />
          食品の在庫数・賞味期限・必要数を、まとめて管理。
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/inventory"
            className={buttonVariants({ size: "lg" })}
          >
            在庫を見る
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            ログインして始める
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-4xl px-6 pb-28">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <h2
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            主な機能
          </h2>
          <p className="text-sm text-muted-foreground">毎日の食品管理をもっとシンプルに</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex gap-4 rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <feature.icon className="size-4" strokeWidth={1.75} />
              </div>
              <div>
                <h3
                  className="mb-1.5 text-base font-semibold leading-snug"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
