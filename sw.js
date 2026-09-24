const C = "machimon-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./privacy.html",
  "./support.html",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
  "./assets/icon-maskable.svg",
  "./js/core/normalize.js",
  "./js/questions/s0.js",
  "./js/questions/s1.js",
  "./js/questions/s2.js",
  "./js/questions/s3.js",
  "./js/questions/s4.js",
  "./js/questions/s5.js",
  "./js/questions/s6.js",
  "./js/questions/s7.js",
  "./js/questions/s8.js",
  "./js/questions/x0.js",
  "./js/questions/x1.js",
  "./js/questions/x2.js",
  "./js/questions/x3.js",
  "./js/questions/x4.js",
  "./js/questions/x5.js",
  "./js/questions/x6.js",
  "./js/questions/x7.js",
  "./js/questions/x8.js",
  "./js/questions/takuitsu.js",
  "./js/questions/takuitsu2.js",
  "./js/questions/takuitsu3.js",
  "./js/questions/kosuu.js",
  "./js/questions/kosuu2.js",
  "./js/questions/nendo.js",
  "./js/questions/nendo2.js",
  "./js/questions/nendo3.js",
  "./js/questions/sentaku.js",
  "./js/questions/sentaku2.js",
  "./js/data-questions.js",
  "./js/learning/schema.js",
  "./js/learning/scheduler.js",
  "./js/audio/audio-manager.js",
  "./js/audio/sfx.js",
  "./js/audio/bgm-files.js",
  "./js/audio/bgm.js",
  "./js/machimon/data/species.js",
  "./js/machimon/data/areas.js",
  "./js/machimon/data/buildings.js",
  "./js/machimon/data/tiers.js",
  "./js/machimon/data/incidents.js",
  "./js/machimon/data/bosses.js",
  "./js/machimon/data/garden.js",
  "./js/machimon/data/sprites.js",
  "./js/machimon/core/state.js",
  "./js/machimon/core/learn.js",
  "./js/machimon/core/economy.js",
  "./js/machimon/core/town.js",
  "./js/machimon/core/hatch.js",
  "./js/machimon/core/evolve.js",
  "./js/machimon/core/incident.js",
  "./js/machimon/core/boss.js",
  "./js/machimon/core/combo-audio.js",
  "./js/machimon/core/onboard.js",
  "./js/machimon/core/tutorial.js",
  "./js/machimon/core/gacha.js",
  "./js/machimon/core/zukan.js",
  "./js/machimon/core/sfx.js",
  "./js/machimon/core/exam.js",
  "./js/machimon/core/garden.js",
  "./js/machimon/core/game.js",
  "./js/machimon/ui/root.js",
  "./js/machimon/ui/coach.js",
  "./js/machimon/ui/intro.js",
  "./js/machimon/ui/celebrate.js",
  "./js/machimon/ui/gacha.js",
  "./js/machimon/ui/zukan.js",
  "./js/machimon/ui/scene.js",
  "./js/machimon/ui/town.js",
  "./js/machimon/ui/incident.js",
  "./js/machimon/ui/mons.js",
  "./js/machimon/ui/hatch.js",
  "./js/machimon/ui/build.js",
  "./js/machimon/ui/boss.js",
  "./js/machimon/ui/record.js",
  "./js/machimon/ui/garden.js",
  "./js/machimon/boot.js",
  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./css/screens.css",
  "./css/machimon.css"
];
/* skipWaiting/clients.claim は使わない: 表示中ページを新SWが乗っ取ると
   旧HTML+新JSの混在ロードが起き、無音の真っ白の温床になる(2026-07-12/14の事象)。
   新バージョンは「全タブを閉じた次の起動」から適用される(1セッション内は常に同一バージョン) */
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* ページ主導の安全な即時切替: 起動直後(load後・プレイ開始前)に main.js から要求された時だけ
   waiting を解除する。SW都合の無差別 skipWaiting と違い、要求元ページは直後に自らリロードする */
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  /* クロスオリジン(Google Fonts等)はSWで扱わずブラウザに素通し。
     キャッシュ対象外(put は同一オリジン限定)な上、ハングした fetch が extendable イベントとして
     残ると waiting → active の切替(スワップ)を永遠にブロックする */
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && e.request.url.startsWith(self.location.origin)) {
        const cp = res.clone();
        caches.open(C).then(c => c.put(e.request, cp));
      }
      return res;
    }).catch(err => {
      /* index.html フォールバックはページ遷移のみ。JS/その他に返すと
         HTMLがJSとしてパースされ SyntaxError → 全画面が無音で真っ白になる */
      if (e.request.mode === "navigate") return caches.match("./index.html");
      throw err;
    }))
  );
});
