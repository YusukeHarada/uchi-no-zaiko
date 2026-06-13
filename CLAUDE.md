# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # 開発サーバー起動 (Turbopack)
npm run build    # 本番ビルド
npm run lint     # ESLint
```

テストは存在しない。

## 環境変数

`.env.local` に以下が必要（Firebase Console のプロジェクト設定から取得）:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## アーキテクチャ概要

### 認証とルーティング

- `src/app/(protected)/layout.tsx` が認証ガードを担う。未ログインは `/login` にリダイレクト。
- ログイン後、`ensureUserAndHousehold(user)` を呼び出し、ユーザー初回時に Firestore 上に household ドキュメントを作成。householdId は `user.uid` と同値。
- `ensureDefaultCategories(householdId)` でデフォルトカテゴリを一度だけ投入する。
- `HouseholdProvider` → `CategoriesProvider` の順でネストし、各ページは `useHouseholdId()` / `useCategories()` で参照する。

### データモデル（Firestore）

すべてのパスは `src/lib/firebase/paths.ts` の `fsPath` オブジェクトで管理する。

```
users/{uid}
households/{hid}/
  items/{itemId}          ← 在庫アイテム
  shoppingList/{itemId}   ← 買い物リスト（itemId は在庫と同じ ID）
  categories/{categoryId}
```

`households/{hid}` の `memberUids` 配列でアクセス制御（Firestore rules に `isMember(hid)` 関数）。

### 買い物リストの自動同期

在庫アイテムの add / update / delete 後、必ず `syncShoppingListForItem(hid, itemId)` を呼ぶ。
この関数が `requiredQuantity > quantity` であれば買い物リストにアイテムを追加/更新し、
条件を満たさなければ削除するというロジックをトランザクション内で実行する（`src/lib/firebase/shopping.ts`）。

### 賞味期限ロジック

`src/lib/expiration.ts` の `getExpirationInfo(expiresAt)` が唯一の判定ロジック。
- `expired`（過去）/ `soon`（0〜3日）/ `ok`（4日以上）/ `none`（未設定）
- `ItemCard` の左側ステータスバーの色（`statusBar`）と Badge はこの返値で決める。

### レイアウト・スクロールモデル

- `html` / `body` を `h-dvh` にしてビューポート高さを固定する。
- `(protected)/layout.tsx` の `<main>` が `overflow-y-auto` のスクロールコンテナ。`AppHeader` は `main` の外（兄弟要素）のため、ページ内の `sticky` 要素は `top-0` で AppHeader 直下に固定できる。`env(safe-area-inset-top)` の計算は不要。
- `main` は `min-h-0` を持つ（flex child のデフォルト `min-height: auto` を打ち消すため必須）。
- BottomNav は `fixed bottom-0 sm:hidden`。モバイル向けに `main` へ `pb-16` を指定しコンテンツが隠れないようにしている。

### UI スタック

- **@base-ui/react v1.5.0**: Tabs・Dialog・Select などの headless プリミティブ。shadcn/ui のように見えるが内部は Base UI であり、API が異なる点に注意。使い方は `node_modules/@base-ui/react/` を参照。
- **Tailwind CSS v4**: `globals.css` の `@theme inline {}` ブロックで CSS 変数をユーティリティクラスにマッピング。カラーは oklch。
- **デザイントークン**: primary = deep forest green (`oklch(0.40 0.125 148)`)、background = warm ivory (`oklch(0.965 0.018 75)`)。
- `card` クラスは `globals.css` で `box-shadow` と `hover` トランジションが定義されているため、カードには `<div className="card ...">` を使う（`<Card>` コンポーネントではなく）。

### PWA

- `public/sw.js`: 最小限のサービスワーカー（現状はパススルーのみ）。
- `src/app/manifest.ts`: PWA マニフェスト。`start_url` は `/inventory`。
- アイコンは `src/app/icon.tsx` / `icon1.tsx` / `icon2.tsx` / `apple-icon.tsx` を `next/og` の `ImageResponse` で動的生成。
- 通知: `src/lib/notifications.ts` で Web Notifications API をラップ。`localStorage` で当日通知済みかを管理し、1 日 1 回だけ送る。

### バーコードスキャン

`@zxing/browser` でカメラストリームを取得・スキャン。iOS Safari では `getUserMedia` をユーザー操作の同期コンテキストで呼ぶ必要があるため、`handleOpenScanner` 内でストリームを取得してから Dialog に渡す（`src/components/inventory/inventory-view.tsx`）。

バーコードヒット後は OpenFoodFacts API (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`) で商品名を検索する（`src/lib/product-lookup.ts`）。
