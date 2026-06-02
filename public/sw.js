// 最小限の Service Worker。PWA インストール要件を満たすために fetch リスナーを置く。
// 将来オフラインキャッシュを追加する場合は install/fetch を拡張すること。

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // pass-through: 既定のネットワーク取得に任せる
});
