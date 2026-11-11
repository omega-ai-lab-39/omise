// 電波がなくても動くしくみ（サービスワーカー）
// アプリを直したら、下の VERSION の数字を1つ上げる → スマホが新しい版に入れかわる
const VERSION = 'omise-v1';
const FILES = ['./', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
const FONT_CACHE = 'omise-fonts';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== VERSION && k !== FONT_CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 文字（Googleフォント）：一度つかった分をとっておく
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONT_CACHE).then(c => c.match(req).then(hit =>
      hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; })
            .catch(() => new Response('', { status: 503 }))
    )));
    return;
  }

  // アプリ本体：とっておいた分をすぐ出す（なければネットから）
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit =>
      hit || fetch(req).catch(() => caches.match('./index.html'))
    ));
  }
});
