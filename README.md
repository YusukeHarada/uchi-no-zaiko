# うちの在庫

家庭の食品在庫・賞味期限・必要数・買い物リストをまとめて管理する Web アプリ。

## 技術スタック

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Firebase** (Authentication / Firestore)
- **Tailwind CSS v4**
- **@base-ui/react v1.5.0** (Tabs / Dialog / Select などの headless プリミティブ)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase プロジェクトを用意

[Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成し、以下を有効化:

- **Authentication** → Google プロバイダ
- **Firestore Database** → 本番モードで開始
- **Cloud Messaging** (期限アラート通知で使用予定)

「プロジェクトの設定 → 全般 → マイアプリ → Web アプリ追加」で構成情報を取得し、
`.env.local.example` をコピーして値を埋める:

```bash
cp .env.local.example .env.local
```

### 3. 開発サーバー起動

```bash
npm run dev
```

ブラウザで <http://localhost:3000> を開く。

## ディレクトリ構成

```
src/
├── app/                          # Next.js App Router
│   ├── (protected)/              # 認証ガード付きレイアウト
│   │   ├── inventory/            # 在庫ページ
│   │   ├── shopping/             # 買い物リストページ
│   │   ├── settings/             # 設定ページ（カテゴリ・家族共有）
│   │   └── layout.tsx            # AppHeader + BottomNav + main スクロールコンテナ
│   ├── layout.tsx                # ルートレイアウト (h-dvh)
│   └── globals.css               # Tailwind v4 テーマ定義
├── components/
│   ├── inventory/                # 在庫関連コンポーネント
│   ├── shopping/                 # 買い物リスト関連
│   ├── settings/                 # 設定関連
│   └── ui/                       # Base UI ベースの共通コンポーネント
└── lib/
    ├── firebase/                 # Firebase 初期化・認証・Firestore
    ├── types/                    # ドメイン型定義
    └── utils.ts
```

## Firestore データモデル

将来的な家族共有を見越して `households` 階層を入れている (Phase 1 では各ユーザーが自身の household を1つ持つ想定):

```
users/{uid}                     ユーザープロフィール
households/{hid}                世帯
├── items/{itemId}              在庫アイテム
└── shoppingList/{itemId}       買い物リスト
```

詳細な型は `src/lib/types/inventory.ts` を参照。

## ロードマップ

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | プロジェクト初期化 (Next.js / Firebase / shadcn) | ✅ 完了 |
| 2 | Google 認証・保護ルート | ✅ 完了 |
| 3 | 在庫 CRUD (カテゴリ別タブ) | ✅ 完了 |
| 4 | 賞味期限の可視化・ソート | ✅ 完了 (Phase 3 で同梱) |
| 5 | バーコードスキャン入力 | ✅ 完了 |
| 6 | 必要数 → 買い物リスト連動 | ✅ 完了 |
| 7 | Cloud Functions + FCM で期限アラート通知 | スコープ外 (Blaze プラン必須) |
| 7-alt | クライアントサイド期限アラート (バナー + OS通知) | ✅ 完了 |
| 8 | PWA 化 | ✅ 完了 |
