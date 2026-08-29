"use strict";
/* ============================================================
   native-bridge.js — iOSネイティブ(Capacitor)での保存の二重化

   Web版では何もしない。__srqStorageReady は null のままなので
   起動経路もWeb時は一切変わらない。

   なぜ必要か:
     WKWebView の localStorage は端末の空き容量が逼迫すると
     OSに破棄されることがある。数ヶ月分のSRS履歴を失うのは
     学習アプリとして致命的なので、Preferences(UserDefaults)に
     写しを持ち、起動時に localStorage が空なら書き戻す。

   なぜ localStorage を主にしたままか:
     Preferences は非同期API。主経路を差し替えると同期で書いている
     既存コードまで非同期化が波及する。localStorage を主・
     Preferences を控えにすれば既存コードは無改造で動き、
     耐久性だけが上がる。
   ============================================================ */
(function(){
  var C = window.Capacitor;
  var native = !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
  if(!native){ window.__srqStorageReady = null; window.__srqMirror = function(){}; return; }

  var P = (C.Plugins && C.Plugins.Preferences) || null;
  if(!P){ window.__srqStorageReady = null; window.__srqMirror = function(){}; return; }

  /* 二重化する対象。engine.js の KEY/OLD_KEY と state/store.js の STORAGE_KEY を網羅する。
     ここで直に書いているのは native-bridge が engine.js より先に読まれるため。
     キーを増やしたらここにも足すこと。 */
  var MIRROR_KEYS = ["sr-quest-v3", "sr-quest-v4", "sr-quest-v2", "sr-quest-premigrate"];

  /* ---- 起動時: localStorage が空なら Preferences から書き戻す ---- */
  window.__srqStorageReady = (function(){
    var jobs = MIRROR_KEYS.map(function(k){
      return P.get({ key: k }).then(function(r){
        var backup = r && r.value;
        var live = null;
        try{ live = localStorage.getItem(k); }catch(e){}
        if(!live && backup){
          try{ localStorage.setItem(k, backup); }catch(e){}
        }else if(live && live !== backup){
          /* localStorage が正。控えを最新に合わせる */
          return P.set({ key: k, value: live }).catch(function(){});
        }
      }).catch(function(){ /* 1キー失敗しても起動は止めない */ });
    });
    return Promise.all(jobs).catch(function(){});
  })();

  /* ---- 保存のたびに控えを更新 ---- */
  var pending = {};
  window.__srqMirror = function(key){
    if(MIRROR_KEYS.indexOf(key) < 0) return;
    if(pending[key]) return;          /* 連続保存をまとめる */
    pending[key] = true;
    setTimeout(function(){
      pending[key] = false;
      var v = null;
      try{ v = localStorage.getItem(key); }catch(e){ return; }
      if(v == null) return;
      P.set({ key: key, value: v }).catch(function(){ /* 控えの失敗はプレイを妨げない */ });
    }, 400);
  };
})();
