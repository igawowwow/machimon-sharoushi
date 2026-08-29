"use strict";
/* ============================================================
   machimon/ui/root.js — MACHIMONの薄いルータと共通パーツ
   ★UIは判断を持たない。すべて core/game.js へ委譲する。
   ★既存アプリのルータ・画面・CSSには一切触れない(独立して開き、1タップで戻れる)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  var UI=MM.ui=MM.ui||{};

  UI.route={screen:"town",params:{}};

  function el(){ return G.document&&G.document.getElementById?G.document.getElementById("app"):null; }
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  UI.esc=esc;

  /* MACHIMONを開く(既存アプリからの入口) */
  UI.open=function(){
    var r=MM.game.enter({});
    UI.lastIdle=r.idle;
    UI.go("town");
  };
  /* 既存アプリへ戻る。★単体配布(__MM_STANDALONE)では MACHIMON だけのゲーム=
     旧アプリへは絶対に出さない(街へ戻るだけ) */
  UI.exit=function(){
    if(G.__MM_STANDALONE){ UI.go("town"); return; }
    try{ if(typeof G.home==="function"){ G.home(); return; } }catch(e){}
    try{ if(G.location)G.location.reload(); }catch(e){}
  };

  UI.go=function(screen,params){
    UI.route={screen:screen,params:params||{}};
    UI.render();
  };
  UI.render=function(){
    var box=el(); if(!box)return;
    var fn=UI.screens[UI.route.screen]||UI.screens.town;
    var html="";
    try{ html=fn(UI.route.params)||""; }
    catch(e){ html='<div class="mm-wrap"><div class="mm-q">画面の表示に失敗しました。<br><button class="small-btn" onclick="MM.ui.go(\'town\')">街へ戻る</button></div></div>'; console.warn(e); }
    box.innerHTML=html;
    try{ if(typeof G.setBgmScene==="function")G.setBgmScene(UI.route.screen==="boss"?"boss":"town"); }catch(e){}
  };

  /* --- 共通パーツ --- */
  /* リソースバー(5種のみ。知識エネルギーだけ色と光で区別する) */
  UI.resBar=function(c){
    var r=c.mm.res;
    var logo=G.__MM_STANDALONE?'<div class="mm-logo">MACHIMON<span>社労士</span></div>':'';
    return logo+'<div class="mm-res">'
      +'<span class="mm-chip">🪙 <b>'+r.g+'</b></span>'
      +'<span class="mm-chip">📘 <b>'+r.xp+'</b></span>'
      +'<span class="mm-chip">🥚 <b>'+r.tama+'</b></span>'
      +'<span class="mm-chip">🧩 <b>'+r.mat+'</b></span>'
      +'<span class="mm-chip mm-ke">✨ 知識 <b>'+r.ke+'</b></span>'
      +(G.__MM_STANDALONE?'':'<span style="margin-left:auto"><button class="small-btn" onclick="MM.ui.exit()" aria-label="もどる">↩</button></span>')
      +'</div>';
  };
  UI.tabs=function(active){
    var T=[["town","🏠","街"],["mons","👾","マチモン"],["build","🔨","建設"],["boss","⚔️","ボス"],["record","📊","記録"]];
    var h='<nav class="mm-tabs" aria-label="MACHIMONナビ">';
    for(var i=0;i<T.length;i++){
      h+='<button type="button" class="'+(T[i][0]===active?"mm-act":"")+'" onclick="MM.ui.go(\''+T[i][0]+'\')">'
        +'<span aria-hidden="true">'+T[i][1]+'</span>'+T[i][2]+'</button>';
    }
    return h+'</nav>';
  };
  UI.bar=function(now,need){
    var p=need>0?Math.max(0,Math.min(100,Math.round(now/need*100))):100;
    return '<div class="mm-bar"><i style="width:'+p+'%"></i></div>';
  };
  UI.ctx=function(){ return MM.game.ctx({}); };

  /* 効果音・ハプティクス(既存の合成音基盤へ流すだけ。無い環境では何もしない) */
  UI.play=function(a){
    if(!a)return;
    try{ if(G.SFX){ if(a.step>=7&&G.SFX.big)G.SFX.big(); else if(a.step>=3&&G.SFX.good)G.SFX.good(); else if(G.SFX.tap)G.SFX.tap(); } }catch(e){}
    try{
      if(a.haptic&&G.Capacitor&&G.Haptics&&G.Haptics.impact)G.Haptics.impact({style:a.haptic});
      else if(a.haptic&&G.navigator&&G.navigator.vibrate)G.navigator.vibrate(a.haptic==="heavy"?24:(a.haptic==="medium"?14:8));
    }catch(e){}
  };
  UI.fxClass=function(a){
    if(!a||!a.fx)return "";
    if(a.fx==="gold")return "mm-fx3";
    if(a.fx==="glow"||a.fx==="wave")return "mm-fx2";
    if(a.fx==="spark")return "mm-fx1";
    return "";
  };

  UI.screens={};
})();
