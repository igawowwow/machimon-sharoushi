const C = "machimon-v4";
const ASSETS = [
  "./", "./index.html", "./manifest.json", "./privacy.html",
  "./icon-192.png", "./icon-512.png", "./icon-180.png", "./assets/icon-maskable.svg",
  "./css/tokens.css", "./css/base.css", "./css/components.css", "./css/screens.css",
  "./js/native-bridge.js", "./js/native-features.js", "./js/native-live-update.js",
  "./js/pwa-install.js",
  "./js/app/lifecycle.js", "./js/app/events.js", "./js/app/router.js", "./js/app/boot.js",
  "./js/app/actions/startToday.js", "./js/screens/home.js", "./js/screens/result.js",
  "./js/screens/explain.js", "./js/screens/battle.js", "./js/screens/adventure.js",
  "./js/components/tabbar.js", "./js/components/button.js", "./js/components/card.js",
  "./js/components/chip.js", "./js/components/progressbar.js", "./js/components/topbar.js", "./js/components/overlay.js",
  "./js/components/zukai-flash.js",
  "./js/state/store.js", "./js/state/slices/player.js", "./js/state/slices/learning.js",
  "./js/state/slices/adventure.js", "./js/state/slices/collection.js", "./js/state/slices/office.js",
  "./js/state/slices/settings.js", "./js/state/legacy-map.js", "./js/state/legacy-shim.js",
  "./js/learning/schema.js", "./js/learning/scheduler.js", "./js/learning/mastery.js", "./js/learning/scoring.js",
  "./js/learning/pools.js", "./js/learning/exam.js", "./js/learning/recommendation.js",
  "./js/learning/selection.js", "./js/learning/strategy.js",
  "./js/game/battle-engine.js", "./js/game/rewards.js", "./js/game/journey.js", "./js/game/battle-select.js",
  "./js/story/story-schema.js", "./js/story/story-state.js", "./js/story/story-conditions.js",
  "./js/story/story-effects.js", "./js/story/story-quest-engine.js", "./js/story/story-evidence-engine.js",
  "./js/story/story-choice-engine.js", "./js/story/story-engine.js",
  "./js/story/story-visuals.js", "./js/story/story-dialogue-renderer.js", "./js/story/story-defeat.js",
  "./js/story/story-cast.js", "./js/story/story-interlude.js", "./js/story/story-realcases.js", "./js/story/story-anim.js",
  "./js/story/chapters/opening.js", "./js/story/chapters/prologue.js", "./js/story/chapters/chapter-01.js",
  "./js/story/story-battle-bridge.js", "./js/story/story-encounter.js", "./js/story/story-battle-beats.js", "./js/story/story-home.js", "./js/story/chapters/chapter-01b.js", "./js/story/chapters/chapter-01c.js", "./js/story/chapters/chapter-02.js", "./js/story/chapters/chapter-02b.js", "./js/story/chapters/chapter-03.js", "./js/story/chapters/chapter-03b.js", "./js/story/chapters/chapter-04.js", "./js/story/chapters/chapter-04b.js", "./js/story/chapters/chapter-05.js", "./js/story/chapters/chapter-05b.js", "./js/story/chapters/chapter-06.js", "./js/story/chapters/chapter-06b.js", "./js/story/chapters/chapter-07.js", "./js/story/chapters/chapter-07b.js", "./js/story/chapters/chapter-08.js", "./js/story/chapters/chapter-08b.js", "./js/story/story-gates.js", "./js/story/story-charcreate.js", "./js/story/story-title.js",
  "./css/machimon.css",
  "./js/machimon/data/species.js",
  "./js/machimon/data/areas.js",
  "./js/machimon/data/buildings.js",
  "./js/machimon/data/tiers.js",
  "./js/machimon/data/incidents.js",
  "./js/machimon/data/bosses.js", "./js/machimon/data/sprites.js",
  "./js/machimon/core/state.js",
  "./js/machimon/core/learn.js",
  "./js/machimon/core/economy.js",
  "./js/machimon/core/town.js",
  "./js/machimon/core/hatch.js",
  "./js/machimon/core/evolve.js",
  "./js/machimon/core/incident.js",
  "./js/machimon/core/boss.js",
  "./js/machimon/core/combo-audio.js",
  "./js/machimon/core/onboard.js", "./js/machimon/core/tutorial.js", "./js/machimon/core/gacha.js", "./js/machimon/core/zukan.js", "./js/machimon/core/sfx.js",
  "./js/machimon/core/exam.js",
  "./js/machimon/core/game.js",
  "./js/machimon/ui/root.js", "./js/machimon/ui/coach.js", "./js/machimon/ui/intro.js", "./js/machimon/ui/celebrate.js", "./js/machimon/ui/gacha.js", "./js/machimon/ui/zukan.js", "./js/machimon/ui/scene.js",
  "./js/machimon/ui/town.js",
  "./js/machimon/ui/incident.js",
  "./js/machimon/ui/mons.js",
  "./js/machimon/ui/hatch.js",
  "./js/machimon/ui/build.js",
  "./js/machimon/ui/boss.js",
  "./js/machimon/ui/record.js",
  "./js/core/normalize.js", "./js/core/recommend.js", "./js/core/weekly.js", "./js/core/course.js", "./js/core/addiction.js",
  "./js/ui-quiz.js", "./js/ui-explain.js", "./js/ui-case.js", "./js/ui-mock.js", "./js/ui-nendo.js", "./js/ui-sentaku.js", "./js/ui-stats.js", "./js/ui-quest.js", "./js/region.js", "./js/ui-map.js",
  "./js/data/case-rouki.js", "./js/data/case-anei.js", "./js/data/case-rousai.js", "./js/data/case-kokunen.js", "./js/data/case-kenpo.js", "./js/data/case-kounen.js",
  "./js/data/case-koyo.js", "./js/data/case-choshu.js", "./js/data/case-ippan.js",
  "./js/data/explain/e0.js", "./js/data/explain/e1.js", "./js/data/explain/e2.js", "./js/data/explain/e3.js", "./js/data/explain/e4.js", "./js/data/explain/e5.js", "./js/data/explain/e6.js", "./js/data/explain/e7.js", "./js/data/explain/e8.js",
  "./js/questions/s0.js", "./js/questions/s1.js", "./js/questions/s2.js",
  "./js/questions/s3.js", "./js/questions/s4.js", "./js/questions/s5.js",
  "./js/questions/s6.js", "./js/questions/s7.js", "./js/questions/s8.js",
  "./js/questions/takuitsu.js", "./js/questions/takuitsu2.js", "./js/questions/takuitsu3.js",
  "./js/questions/kosuu.js", "./js/questions/kosuu2.js",
  "./js/questions/nendo.js", "./js/questions/nendo2.js", "./js/questions/nendo3.js",
  "./js/questions/sentaku.js", "./js/questions/sentaku2.js",
  "./js/data/glossary-ext.js", "./js/data/glossary-ext2.js",
  "./js/data-sprites.js", "./js/data-questions.js", "./js/data-learn.js", "./js/data-learn2.js",
  "./js/game-data.js", "./js/data/enemies.js", "./js/data/villains.js", "./js/data-companions.js", "./js/data-beats.js", "./js/ui-office.js", "./js/data-achievements.js",
  "./js/audio/audio-manager.js", "./js/audio/sfx.js", "./js/audio/bgm.js", "./js/audio/bgm-files.js", "./js/fx.js", "./js/engine.js", "./js/gear-power.js", "./js/data-gear.js", "./js/ui-gold.js",
  "./js/ui-battle.js", "./js/gear-fx.js", "./js/ui-intro.js", "./js/ui-quickstart.js", "./js/ui-ladder.js", "./js/ui-overlays.js", "./js/ui-home.js", "./js/ui-home-menus.js", "./js/ui-journey.js", "./js/ui-collection.js", "./js/ui-soundtest.js", "./js/gacha-suspense.js", "./js/gacha-fx.js", "./js/gacha-history.js",
  "./js/ui-bestiary.js", "./js/ui-notebook.js", "./js/main.js"
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
