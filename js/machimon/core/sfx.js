"use strict";
/* ============================================================
   machimon/core/sfx.js — 効果音(Web Audio合成・素材なし)
   js/audio/sfx.js の tone/sweep(ミュートを尊重)を使って、リズムのある音を組む。
   「正解の音は連続正解で高くなる」「生まれる前はドラムロール」など。無い環境では無音で落ちる。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  function T(f,t,d,ty,v){ try{ if(typeof G.tone==="function")G.tone(f,t,d,ty||"square",v==null?.09:v); }catch(e){} }
  function S(f0,f1,t,d,ty,v){ try{ if(typeof G.sweep==="function")G.sweep(f0,f1,t,d,ty||"square",v==null?.08:v); }catch(e){} }
  var C=[523,659,784,1047,1319,1568,2093];   /* Cメジャー */
  var sfx={
    tap:function(){ T(880,0,.04,"square",.05); },
    /* 正解: 連続正解が のびるほど音が高く・長く(最大6音) */
    correct:function(combo){
      var n=Math.min(6,2+Math.floor((combo||0)/2));
      for(var i=0;i<n;i++)T(C[i],i*.07,.12,"square",.09);
      if(combo>=5)S(C[n-1],C[n-1]*2,n*.07,.25,"triangle",.07);
    },
    wrong:function(){ T(220,0,.15,"sawtooth",.1); T(160,.12,.3,"sawtooth",.1); },
    coin:function(i){ T(1568,(i||0)*.05,.05,"square",.06); T(2093,(i||0)*.05+.04,.08,"square",.06); },
    /* 昇進・看板がえ など: ドンドンドン → ファンファーレ */
    fanfare:function(){
      for(var i=0;i<3;i++){ T(110,i*.16,.12,"square",.14); T(80,i*.16,.14,"sawtooth",.1); }
      var t=.55; [523,659,784,1047].forEach(function(f,i){ T(f,t+i*.09,.18,"square",.11); });
      T(1319,t+.4,.5,"square",.12); T(1047,t+.4,.5,"triangle",.08);
    },
    /* 節目: 長めのファンファーレ */
    big:function(){ [523,659,784,1047,784,1047,1319,1568].forEach(function(f,i){ T(f,i*.1,.16,"square",.11); }); T(2093,.85,.7,"square",.13); T(1568,.85,.7,"triangle",.08); },
    /* タマゴ・配合・取組の前: ドラムロール(n拍) */
    roll:function(beats){ beats=beats||8; for(var i=0;i<beats;i++){ T(90+i*6,i*.1,.06,"square",.1); T(60,i*.1,.05,"sawtooth",.08); } },
    levelup:function(){ [659,784,1047,1319].forEach(function(f,i){ T(f,i*.06,.15,"square",.1); }); }
  };
  MM.sfx=sfx;
})();
