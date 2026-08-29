"use strict";
/* ============================================================
   state/legacy-shim.js — 互換シム(移行中だけ生かす橋)
   ・window.gameState を Proxy で旧ST形に見せる(読=slice射影 / 書=Store.commit委譲)
   ・saveST() を Store.save() に委譲する薄いラッパを公開
   → 旧 ui-*.js が ST.coins 等を従来通り読み書きできる土台。

   【Phase3aの安全設計】このシムはロード時に副作用を持たない(Store.load は遅延)。
   index.html では engine.js より前に読むが、engine.js が後から window.gameState/saveST を
   自身の定義で上書きする = 旧UIの挙動は一切変えない(engine.js が現行の真実源のまま)。
   シム本体(SRLegacy.gameState / SRLegacy.saveST)は独立に公開し、往復はテストで担保する。
   engine.js を撤去する後続Phaseで、この Proxy がそのまま真実源へ昇格できる。

   既知の制限: 旧コードの「入れ子ミューテーション」(ST.opt.mute=true 等、get で得た射影
   サブオブジェクトへの再代入)は Proxy 越しには反映されない。トップレベル代入
   (ST.coins=100)は反映される。この制限があるため Phase3a では engine.js を真実源に保つ。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SR = G.SRState = G.SRState || {};

  function Store(){ return SR.Store; }
  function Map_(){ return SR.legacyMap; }

  /* Store.state を遅延初期化(ロード時の副作用ゼロを保証) */
  function ensureStore(){
    var st = Store();
    if(st && !st.state) st.load();
    return st ? st.state : null;
  }

  function projectFlat(){
    var m = Map_(); return m ? m.stateToLegacy(ensureStore()) : {};
  }

  var hasProxy = (typeof G.Proxy === "function");
  var gameStateShim;

  if(hasProxy){
    gameStateShim = new G.Proxy({}, {
      get: function(_t, prop){
        if(prop==="__isSRLegacyShim") return true;
        var flat = projectFlat();
        return flat[prop];
      },
      set: function(_t, prop, val){
        var st = Store(), m = Map_();
        if(!st || !m) return true;
        st.commit(function(state){
          var flat = m.stateToLegacy(state);
          flat[prop] = val;
          var ns = m.legacyToState(flat);
          for(var k in ns){ state[k] = ns[k]; }
        });
        return true;
      },
      has: function(_t, prop){ return prop in projectFlat(); },
      ownKeys: function(){ return Reflect.ownKeys(projectFlat()); },
      getOwnPropertyDescriptor: function(_t, prop){
        var flat = projectFlat();
        if(Object.prototype.hasOwnProperty.call(flat, prop)){
          return { enumerable:true, configurable:true, writable:true, value:flat[prop] };
        }
        return undefined;
      }
    });
  } else {
    /* Proxy 非対応環境: スナップショットのフォールバック(読み取り主体) */
    gameStateShim = { get __isSRLegacyShim(){ return true; } };
  }

  function saveShim(){ var st = Store(); return st ? st.save() : undefined; }

  SR.legacyShim = { gameState:gameStateShim, saveST:saveShim, ensureStore:ensureStore, projectFlat:projectFlat };
  G.SRLegacy = SR.legacyShim;

  /* window レベルの公開(engine.js が後から上書きする = 旧UI挙動は不変)。
     engine.js が存在しない後続Phaseでは、この行がそのまま真実源の結線になる。 */
  try{ G.gameState = gameStateShim; }catch(e){}
  try{ if(typeof G.saveST !== "function") G.saveST = saveShim; }catch(e){}
})();
