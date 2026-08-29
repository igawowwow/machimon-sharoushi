"use strict";
/* ============================================================
   app/boot.js — 起動の受け皿(Phase3b 基盤・並置)
   設計上の起動: Store.load → checkDaily → 初回導入 or router.start
   ただし【この Phase では自動起動しない】。main.js が現行の真の起動を握り続ける。
   ここは「新機構の起動口」を用意するだけ(旧起動と衝突させない=旧UI無傷)。
   後続Phaseで main.js の起動をこの Boot.start() へ段階的に移す。
   非module classic script。名前空間 window.SRApp。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  var Boot = {
    started: false,

    /* 新機構の起動(受け皿)。呼ばれるまで副作用ゼロ。 */
    start: function(opts){
      opts = opts || {};
      if(this.started) return;
      this.started = true;

      /* 1. 状態ロード(壊れ保存でも Store 側で fresh フォールバック=throw しない) */
      var Store = G.Store;
      try{ if(Store && !Store.state) Store.load(); }catch(e){}

      /* 2. 日次チェック(旧ロジックがあれば流用) */
      try{ if(typeof G.checkDaily==="function") G.checkDaily(); }catch(e){}

      /* 3. 音声/テーマの反映(あれば) */
      try{ if(G.AudioMgr && typeof G.AudioMgr.applyFromState==="function") G.AudioMgr.applyFromState(); }catch(e){}

      /* 4. 初回導入 or ルーター起動 */
      var R = APP.router;
      var goIntro = false;
      try{ goIntro = (typeof G.introNeedsBoot==="function") ? !!G.introNeedsBoot() : false; }catch(e){}
      if(goIntro && typeof opts.onIntro==="function"){ try{ opts.onIntro(); }catch(e){} return; }
      if(R && typeof R.start==="function"){ R.start(opts.initial || { tab:"home", screen:"home", params:{} }); }
    },

    /* 明示リセット(テスト/再起動用) */
    reset: function(){ this.started = false; }
  };

  APP.boot = Boot;
})();
