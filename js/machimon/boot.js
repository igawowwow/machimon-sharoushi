"use strict";
/* ============================================================
   machimon/boot.js — マチモン社労士 単体アプリの土台
   ★このアプリは「育てる・かけ合わせる・番付をのぼる」だけで完結する。
     ここが状態・保存・日付・科目名を持つ唯一の場所。
   ★2.0 で遊びを作り直した。1.x のセーブを読みこむ前に、セーブ全体を別のキー(machimon-v1-backup)へ
     1回だけ写す(戻せるように)。引っ越しそのものは core/mon.js。
   ★保存キーは machimon-v1。旧・共有セーブ(sr-quest-v3)しか無い端末では、初回だけ
     学習履歴(q)とマチモン(mm)を引き継ぐ(進捗を失わせない)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var KEY="machimon-v1", OLD="sr-quest-v3", BACKUP="machimon-v1-backup";

  G.SUBJECTS=["労働基準法","労働安全衛生法","労災保険法","雇用保険法","労働保険徴収法","健康保険法","国民年金法","厚生年金保険法","労一・社一"];

  function lsOK(){ try{ G.localStorage.setItem("__t","1"); G.localStorage.removeItem("__t"); return true; }catch(e){ return false; } }
  var USE_LS=lsOK();
  function parse(raw){ return JSON.parse(raw,function(k,v){ return (k==="__proto__"||k==="constructor"||k==="prototype")?undefined:v; }); }

  function defaults(){ return { v:1, q:{}, rq:[], mm:null, opt:{mute:false,bgm:false,bgmVol:0.7,seVol:0.8} }; }

  var ST=defaults();
  function load(){
    try{
      var raw=USE_LS?G.localStorage.getItem(KEY):null;
      if(raw){ ST=Object.assign(defaults(),parse(raw));
        /* まだ 2.0 のセーブ(mm.g2)を持っていない = 1.x のセーブ。読みこんで形を変える前に、そのまま写しておく */
        try{ var g2=ST.mm&&ST.mm.g2; if(!(g2&&g2.on)&&!G.localStorage.getItem(BACKUP))G.localStorage.setItem(BACKUP,raw); }catch(e2){} }
      else if(USE_LS){
        /* 旧・共有セーブからの引き継ぎ(学習履歴とマチモンだけ。他モードのデータは持ち込まない) */
        var o=G.localStorage.getItem(OLD);
        if(o){ var s=parse(o); ST=defaults(); ST.q=s.q||{}; ST.rq=Array.isArray(s.rq)?s.rq:[]; ST.mm=s.mm||null; if(s.opt)ST.opt=Object.assign(ST.opt,{mute:!!s.opt.mute,bgm:!!s.opt.bgm,bgmVol:s.opt.bgmVol,seVol:s.opt.seVol}); }
      }
    }catch(e){ ST=defaults(); }
    if(!ST.q||typeof ST.q!=="object")ST.q={};
    G.gameState=ST;
    try{ if(G.MM&&G.MM.state)ST.mm=G.MM.state.normalize(ST.mm); }catch(e){}
    return ST;
  }
  function saveNow(){
    try{ if(USE_LS)G.localStorage.setItem(KEY,JSON.stringify(ST)); }catch(e){}
  }
  G.saveNow=saveNow;
  G.todayNum=function(){ var d=new Date(); return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/864e5); };

  load();
  if(G.addEventListener){
    G.addEventListener("pagehide",saveNow);
    if(G.document&&G.document.addEventListener)G.document.addEventListener("visibilitychange",function(){ if(G.document.visibilityState==="hidden")saveNow(); });
  }

  /* Service Worker(Web版のオフライン用)。ネイティブ(capacitor://)では登録しない */
  try{
    var httpish=G.location&&/^https?:$/.test(G.location.protocol);
    if(httpish&&!G.Capacitor&&G.navigator&&G.navigator.serviceWorker){
      G.addEventListener("load",function(){ G.navigator.serviceWorker.register("sw.js").catch(function(){}); });
    }
  }catch(e){}

  /* 起動(DOM準備後) */
  function start(){
    try{
      if(!G.MM||!G.MM.ui||!G.MM.ui.open){ setTimeout(start,50); return; }
      G.MM.ui.open();
      G.__mmBoot=true;   /* index.html の起動ウォッチドッグへ「起動できた」と伝える */
    }catch(e){ if(G.console)console.error(e); }
  }
  G.__mmStart=start;
  if(G.document){
    if(G.document.readyState==="loading")G.document.addEventListener("DOMContentLoaded",start);
    else start();
  }
})();
