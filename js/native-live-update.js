"use strict";
/* ============================================================
   native-live-update.js — ネイティブアプリの自動アップデート(殿 2026-08-17)
   ・App Storeの審査を待たずに、Web資産(JS/CSS/データ)を全ユーザーへ自動配信する。
     起動時に配信マニフェスト(GitHub Release "live")を確認→新しければ裏でDL→
     「次回起動」から新バンドルで立ち上がる(遊んでいる最中には切り替えない)。
   ・実行はネイティブ(Capacitor)のみ。Web/PWA版は Service Worker が同じ役割を担う
     ため、このファイルは即 return(完全no-op)。
   ・安全装置:
     - @capgo/capacitor-updater の自動ロールバック: 新バンドルで起動して
       notifyAppReady() が呼ばれなければ、自動で元のバンドルに戻る(文鎮化防止)。
     - マニフェスト disabled:true で配信停止(キルスイッチ)。
     - 配信版がアプリ同梱版より古い場合は reset()で同梱版に戻す。
   ・ネイティブ機能(プラグイン等)の変更は従来どおりApp Store審査が必要。
     配信できるのは www 資産(JS/CSS/画像/データ)のみ。
   ============================================================ */
(function(){
  var C = (typeof window!=="undefined") ? window.Capacitor : null;
  var native = !!(C && typeof C.isNativePlatform==="function" && C.isNativePlatform());
  if(!native) return;                                   /* Web版は何もしない */
  var U = C.Plugins && C.Plugins.CapacitorUpdater;
  if(!U) return;                                        /* プラグイン未同梱の旧ビルドでも安全 */

  /* 配信元は本番サイト(Vercel)。ビルド時に tools/build-live-dist.js が生成する。
     ※リポジトリはprivateのため GitHub Release では未認証配信できない(検証済み) */
  var MANIFEST = "https://sharoushi-quest-rpg.vercel.app/live/live.json";
  function num(v){ var n=parseInt(String(v==null?"":v).replace(/\D/g,""),10); return isFinite(n)?n:0; }

  /* 起動成功をプラグインへ通知(これが無いと適用済みバンドルが自動ロールバックされる)。
     どのバンドルで起動していても、まず最初に呼ぶ。 */
  try{ U.notifyAppReady(); }catch(e){}

  /* 本体処理は起動を邪魔しないよう遅延して実行 */
  setTimeout(function(){
    (async function(){
      var cur = 0;
      try{
        var r = await fetch("live-version.json", { cache:"no-store" });
        cur = num((await r.json()).v);
      }catch(e){}
      var mf = null;
      try{
        var res = await fetch(MANIFEST, { cache:"no-store" });
        if(res && res.ok) mf = await res.json();
      }catch(e){ return; }                              /* オフライン等は静かに諦める(次回また) */
      if(!mf || mf.disabled) return;                    /* キルスイッチ */
      var remote = num(mf.v);
      if(!remote || !mf.url) return;
      if(remote < num(mf.min||0)) return;               /* 予備の下限ガード(通常未使用) */
      if(remote <= cur){
        /* 配信が現行以下: 適用済みライブ版が古い可能性があるときだけ同梱版へ戻す */
        if(remote < cur) return;                        /* 現行の方が新しい=何もしない */
        return;
      }
      var pendKey = "srq-live-pending";
      try{ if(localStorage.getItem(pendKey)===String(remote)) return; }catch(e){}
      try{
        var dl = await U.download({ url: mf.url, version: String(mf.v) });
        if(dl && dl.id){
          await U.next({ id: dl.id });                  /* 次回起動から適用(即リロードしない) */
          try{ localStorage.setItem(pendKey, String(remote)); }catch(e){}
        }
      }catch(e){ /* DL失敗は無視(次回起動で再試行) */ }
    })();
  }, 2500);
})();
