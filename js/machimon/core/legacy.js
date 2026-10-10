"use strict";
/* ============================================================
   machimon/core/legacy.js — 1.x のセーブ(c.mm.gd)を読むだけの道具
   ★2.0 で遊びを作り直した。1.x の遊びのコードはもう無い。ここに残したのは、
     1.x のセーブから「引っ越しに要るもの」だけを安全に取り出す読み取りだけ(書きこまない)。
   ★取り出すもの: おうちの子(生きている子)・タマゴ袋の子・自分の名マチモンの名前・メダル・タマゴの数・色ちがいの数。
   ★壊れた値は安全な値へ丸める。引数は書きかえない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  var KEYS=["h","m","o","j","s"];
  var RAR_MIN=[0,250,300,350,400,440];          /* 1.x のレア度 = 能力5つの合計(N R SR SSR UR LG) */
  function obj(v){ return (v&&typeof v==="object"&&!Array.isArray(v))?v:null; }
  function int(v,d,lo,hi){ v=Number(v); if(!isFinite(v))v=d; return Math.round(Math.max(lo,Math.min(hi,v))); }

  function plant(p){
    p=obj(p); if(!p)return null;
    var o={ i:String(p.i||"").slice(0,12), n:String(p.n||"").replace(/[<>"]/g,"").slice(0,20), f:int(p.f,0,0,8), w:int((obj(p.r)||{}).w,0,0,1e7) };
    for(var i=0;i<KEYS.length;i++)o[KEYS[i]]=int(p[KEYS[i]],30,1,100);
    o.adult=(p.bw!=null); o.dead=!!p.dead; o.own=!!p.own;
    o.tr=(typeof p.tr==="string")?p.tr:""; o.sh=p.sh?1:0;
    return o;
  }
  function list(a,max){ return (Array.isArray(a)?a:[]).map(plant).filter(Boolean).slice(0,max); }
  function sum(p){ var s=0; for(var i=0;i<KEYS.length;i++)s+=p[KEYS[i]]||0; return s; }
  function rar(p){ var s=sum(p), out=0; for(var i=0;i<RAR_MIN.length;i++)if(s>=RAR_MIN[i])out=i; return out; }
  /* 1.x のセーブ → 引っ越しに使う形 */
  function read(raw){
    var s=obj(raw)||{};
    return { on:s.on?1:0,
      mons:list(s.plots,60).filter(function(p){ return !p.dead; }).concat(list(s.seeds,200)),
      hall:list(s.mb,400).filter(function(m){ return m.own; }).map(function(m){ return m.n; }),
      medal:int(s.medal,0,0,1e6), pulls:int(s.pulls,0,0,1e9), shiny:int(s.shiny,0,0,1e9) };
  }
  MM.legacy={ KEYS:KEYS, read:read, rar:rar, sum:sum };
})();
