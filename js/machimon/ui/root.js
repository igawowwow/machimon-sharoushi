"use strict";
/* ============================================================
   machimon/ui/root.js — 薄いルータと共通パーツ
   ★UIは判断を持たない。すべて core/* へ委譲する。
   ★画面は UI.screens に登録し、行ける画面を UI.v2ok に書く(書いていない名前はホームへ寄せる)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  var UI=MM.ui=MM.ui||{};

  UI.route={screen:"h2",params:{}};
  UI.screens={};
  UI.v2ok={};

  function el(){ return G.document&&G.document.getElementById?G.document.getElementById("app"):null; }
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  UI.esc=esc;

  /* 起動: はじめてならオープニング、2回目からはホーム */
  UI.open=function(){
    var r=MM.game.enter({});
    if(!r.c.mm.ms.intro&&!(r.c.mm.gd&&r.c.mm.gd.on)&&!(r.c.mm.g2&&r.c.mm.g2.on)){ UI.go("intro",{page:1}); return; }
    if(!r.c.mm.ms.intro)MM.game.finishIntro(r.c,r.c.mm.name);        /* 1.x から来た人は オープニングを出さない(なかまは引っ越しで来る) */
    UI.go("h2");
  };
  UI.go=function(screen,params){
    if(!UI.v2ok[screen]){ screen="h2"; params={}; }
    UI.route={screen:screen,params:params||{}};
    UI.render();
  };
  UI.render=function(){
    var box=el(); if(!box)return;
    var fn=UI.screens[UI.route.screen]||UI.screens.h2, html="";
    try{ html=fn(UI.route.params)||""; }
    catch(e){ html='<div class="mm-wrap"><div class="mm-q">画面の表示に失敗しました。<br><button class="small-btn" onclick="MM.ui.go(\'h2\')">もどる</button></div></div>'; if(G.console)console.warn(e); }
    box.innerHTML=html;
    try{ if(typeof G.setBgmScene==="function")G.setBgmScene(UI.route.screen==="bzBout"?"mmboss":"mmtown"); }catch(e){}
  };

  UI.bar=function(now,need){
    var p=need>0?Math.max(0,Math.min(100,Math.round(now/need*100))):100;
    return '<div class="mm-bar"><i style="width:'+p+'%"></i></div>';
  };
  UI.ctx=function(){ return MM.game.ctx({}); };
  UI.toast=function(t){
    try{ var d=G.document.createElement("div"); d.className="mm-gtoast"; d.textContent=t; G.document.body.appendChild(d); setTimeout(function(){ try{ d.remove(); }catch(e){} },2600); }catch(e){}
  };

  /* 効果音・ハプティクス(無い環境では何もしない) */
  UI.play=function(a){
    if(!a)return;
    try{ if(a.sfx&&MM.sfx&&MM.sfx[a.sfx]){ MM.sfx[a.sfx](a.arg); }
         else if(a.step!=null&&MM.sfx){ if(a.step>=7)MM.sfx.big(); else if(a.step>=3)MM.sfx.levelup(); else MM.sfx.tap(); } }catch(e){}
    try{
      if(a.haptic&&G.Capacitor&&G.Haptics&&G.Haptics.impact)G.Haptics.impact({style:a.haptic});
      else if(a.haptic&&G.navigator&&G.navigator.vibrate)G.navigator.vibrate(a.haptic==="heavy"?24:(a.haptic==="medium"?14:8));
    }catch(e){}
  };
})();
