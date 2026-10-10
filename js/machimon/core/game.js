"use strict";
/* ============================================================
   machimon/core/game.js — セッションの取りまとめ(UIが呼ぶ窓口)
   ★依存の向き: ui/* → core/game.js → core/* → data/*。逆向きの依存を作らない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  function ctx(o){ return MM.state.ctx(o); }
  /* 起動・画面復帰のたびに呼ぶ: 日付の更新だけ(放置で増えるものは無い) */
  function enter(o){
    var c=ctx(o), rolled=MM.state.rollDay(c);
    if(!c.mm.on)c.mm.on=1;
    save();
    return { c:c, rolled:rolled };
  }
  /* オープニングを終える(街の名前を決める) */
  function finishIntro(c,name){
    if(c.mm.ms.intro)return false;
    c.mm.ms.intro=1;
    c.mm.name=String(name||"マチモンタウン").replace(/[<>"]/g,"").slice(0,12)||"マチモンタウン";
    return true;
  }
  function save(){ try{ if(typeof G.saveNow==="function")G.saveNow(); }catch(e){} }
  MM.game={ ctx:ctx, enter:enter, finishIntro:finishIntro, save:save };
})();
