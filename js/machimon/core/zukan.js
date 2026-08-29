"use strict";
/* ============================================================
   machimon/core/zukan.js — 図鑑(発見済み種族)と達成報酬(ガチャチケット)
   ★系統(3体)コンプ=🎫3枚 / 全30体コンプ=🎫30枚。チケットはガチャ専用(コイン不要)。
   ★図鑑を埋める手段=ガチャ/孵化(=コイン=解いた量)と、進化(=学習でしか進まない)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  var LINE_TIX=3, ALL_TIX=30;

  /* 所持マチモンを図鑑へ反映(冪等)。新規発見の種族idを返す */
  function mark(c){
    var dex=c.mm.dex, out=[];
    for(var u in c.mm.mons){ var sp=c.mm.mons[u].sp; if(!dex[sp]){ dex[sp]=1; out.push(sp); } }
    return out;
  }
  /* 系統ごと(sub -1..8)の3体 */
  function lines(){
    var L={}, S=MM.DATA.species;
    for(var i=0;i<S.length;i++){ (L[S[i].sub]=L[S[i].sub]||[]).push(S[i]); }
    var out=[]; for(var k in L)out.push({sub:Number(k),list:L[k]});
    out.sort(function(a,b){ return a.sub-b.sub; });
    return out;
  }
  function count(c){ var n=0; for(var k in c.mm.dex)n++; return n; }
  /* 達成の未受取ぶんを付与。付与内容の配列を返す */
  function claim(c){
    mark(c);
    var got=[], L=lines(), names=G.SUBJECTS||[];
    for(var i=0;i<L.length;i++){
      var key="L"+L[i].sub; if(c.mm.dexc[key])continue;
      var full=L[i].list.every(function(s){ return c.mm.dex[s.id]; });
      if(full){ c.mm.dexc[key]=1; c.mm.tix+=LINE_TIX; got.push({title:(L[i].sub<0?"街ライン":names[L[i].sub]||"")+" コンプ！",tix:LINE_TIX}); }
    }
    if(!c.mm.dexc.ALL&&count(c)>=MM.DATA.species.length){ c.mm.dexc.ALL=1; c.mm.tix+=ALL_TIX; got.push({title:"図鑑 全30体コンプリート！！",tix:ALL_TIX}); }
    return got;
  }
  MM.zukan={ LINE_TIX:LINE_TIX, ALL_TIX:ALL_TIX, mark:mark, lines:lines, count:count, claim:claim };
})();
