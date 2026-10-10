"use strict";
/* ============================================================
   machimon/core/power.js — 「つよさ」を1つの数字にする(表示専用。仕組みは変えない)
   ★どの画面でもマチモンの横に同じ数字を出し、「いまの看板(おうちの最強)との差」を矢印で見せる。
   ★おとな=いまの5能力(調子こみ)の合計。まだ育っていない子・タマゴ=素質(育ちきったときの力)の合計。
     どちらも特性の補正こみ(core/garden.js の cur と同じ式)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  var KEYS=["h","m","o","j","s"];
  function GA(){ return MM.garden; }

  function traitMul(p,k){ var m=1; if(p.tr==="star")m*=1.06; if(p.tr==="cosmos")m*=1.10; if(k==="o"&&p.tr==="giant")m*=1.15; return m; }
  function of(g,p){
    if(!p||p.dead)return 0;
    var s=0, adult=(p.bw!=null);
    for(var i=0;i<KEYS.length;i++){ var k=KEYS[i]; s+=adult?GA().cur(g,p,k):Math.round((p[k]||0)*traitMul(p,k)); }
    return Math.round(s);
  }
  /* おうちの中の最強(=看板)。いなければ null */
  function best(g){
    var b=null, bv=-1;
    for(var i=0;i<g.plots.length;i++){ var p=g.plots[i]; if(!p||p.dead)continue; var v=of(g,p); if(v>bv){ bv=v; b=p; } }
    return b?{p:b,v:bv}:null;
  }
  /* 看板との差。看板そのものなら top:true */
  function diff(g,p){
    var b=best(g), v=of(g,p);
    if(!b)return {v:v,d:0,top:false,none:true};
    return {v:v,d:v-b.v,top:b.p===p,none:false};
  }
  /* 同じレア度の帯のなかでの位置(0=いちばん下 … 1=いちばん上) */
  function pct(p){
    var R=MM.DATA.garden.RARITY, s=GA().sum(p), r=GA().rarity(p);
    var lo=r===0?150:R[r].min, hi=R[r+1]?R[r+1].min:500;
    return Math.max(0,Math.min(1,(s-lo)/Math.max(1,hi-lo)));
  }
  MM.power={ of:of, best:best, diff:diff, pct:pct };
})();
