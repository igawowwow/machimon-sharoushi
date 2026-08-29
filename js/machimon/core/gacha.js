"use strict";
/* ============================================================
   machimon/core/gacha.js — マチモンガチャ(コインで引く)
   ★コインは「問題を解く」か「街の放置生産(=解いた量で倉庫上限が決まる)」でしか増えない
     = ガチャも結局は学習量に比例する。課金なし。
   ★排出: N45 / R30 / SR18 / SSR6 / UR1(%)。天井30(SR以上確定)。10連はSR以上1枠確定。
   ★ダブり=🧩才能結晶(進化素材)+絆。引き損なし。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  var COST1=300, COST10=2700, DUPE_MAT=[2,3,5,10,20];
  var RATE=[0.60,0.25,0.11,0.035,0.005], PITY=50;   /* レアは渋く。天井50でSR以上 */
  function rollRar(c){
    if((c.mm.pity||0)>=PITY)return 2;
    var r=c.rand(),acc=0;
    for(var i=0;i<RATE.length;i++){ acc+=RATE[i]; if(r<acc)return i; }
    return 0;
  }

  function pool(){ return MM.DATA.species; }          /* 全30体(進化段階も含む=図鑑が埋まる楽しみ) */
  function byRar(r){ return pool().filter(function(s){ return s.rar===r; }); }

  function rollOne(c,forceSR){
    var rar=forceSR?Math.max(2,rollRar(c)):rollRar(c);
    var cand=byRar(rar); var tries=0;
    while(!cand.length&&tries++<5){ rar=Math.max(0,rar-1); cand=byRar(rar); }
    var sp=cand[Math.floor(c.rand()*cand.length)];
    c.mm.pity=(rar>=2)?0:((c.mm.pity||0)+1);
    /* ダブり判定(同種族を既に持っていれば素材へ) */
    var dupe=false;
    for(var u in c.mm.mons){ if(c.mm.mons[u].sp===sp.id){ dupe=true; break; } }
    var out={ sp:sp.id, rar:sp.rar, name:sp.name, dupe:dupe, mat:0, uid:"" };
    if(dupe||Object.keys(c.mm.mons).length>=MM.state.MON_CAP){ out.mat=DUPE_MAT[sp.rar]||2; c.mm.res.mat+=out.mat; }
    else { var uid="u"+(c.mm.uid++); c.mm.mons[uid]={ sp:sp.id, lv:1, xp:0, born:c.today, place:"" }; out.uid=uid; }
    return out;
  }

  function pull(c,n){
    var cost=n>=10?COST10:COST1, tix=c.mm.tix||0;
    if(tix>=n)c.mm.tix=tix-n;                          /* 🎫があればコイン不要 */
    else if(!MM.economy.spend(c,"g",cost))return null;
    var res=[], gotSR=false;
    for(var i=0;i<n;i++){
      var force=(n>=10&&i===n-1&&!gotSR);
      var r=rollOne(c,force); res.push(r); if(r.rar>=2)gotSR=true;
    }
    c.mm.gacha=(c.mm.gacha||0)+n;
    return res;
  }
  function canPull(c,n){ return (c.mm.tix||0)>=n||(c.mm.res.g||0)>=(n>=10?COST10:COST1); }

  MM.gacha={ COST1:COST1, COST10:COST10, pull:pull, canPull:canPull, pool:pool, PITY:PITY, RATE:RATE, rollRar:rollRar };
})();
