"use strict";
/* ============================================================
   screens/home.js — 新ホーム(単一CTA「今日の冒険」)(Phase4c)
   ------------------------------------------------------------
   §3.3(単一CTA): ホームは薄い。Primary CTA は「今日の冒険」1つだけ。
     render():
       ① <PrimaryCTA "今日の冒険" data-action="startToday">   ← 唯一の .btn--primary
       ② <StatusStrip> 連続日数 / due件数 / 悪魔到達度ゲージ   ← 軽い状態サマリのみ
       ③ <NextHint>    nextBestAction の1行(テキストのみ・別CTAにしない)
   ・事件簿/模試/道場/サバイバル/ボスグリッド等の大ボタン群はホームに出さない
     (冒険/育成/その他タブへ)。
   ・副作用(BGMシーン適用・achチェック)は lifecycle enter フックへ分離。
     BGMシーンは app/lifecycle の SCENE(home→town)が自動適用。
   ・XSS: 全ての動的値は esc() 経由(生値を innerHTML に入れない)。全ボタン 44px は CSS 側。
   非module classic script。router.register("home") + lifecycle.onEnter("home")。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function num(v,d){ v=Number(v); return Number.isFinite(v)?v:(d||0); }

  function tile(icon, label, val){
    return '<div class="status-tile">'
         + '<div class="status-tile__label">' + esc(icon) + ' ' + esc(label) + '</div>'
         + '<div class="status-tile__val">' + esc(val) + '</div>'
         + '</div>';
  }

  function render(/*params, route*/){
    var A  = APP.actions || {};
    var btn = APP.button, pb = APP.progressbar;
    var env = (typeof A.buildEnv==="function") ? A.buildEnv() : null;

    var streak=0, due=0, pass=0, readiness=0, hint="";
    try{ var st=G.Store&&G.Store.state; streak = st ? num(st.player.login.days,0) : 0; }catch(e){}
    try{ if(env) due = G.SRLearning.pools.dueIds(env).length; }catch(e){}
    try{ if(env) pass = Math.round(num(G.SRLearning.mastery.passPct(env),0)); }catch(e){}
    try{ readiness = num(G.SRGame.journey.demonReadiness({ passPct:pass }),0); }catch(e){}
    try{ var nba = G.SRGame.journey.nextBestAction({ dueCount:due }); hint = (nba&&nba.label)||""; }catch(e){}

    var size = (typeof A.sessionSize==="function") ? A.sessionSize() : 5;
    var mins = Math.max(1, Math.round(size*15/60));

    /* ① 唯一の Primary CTA(今日の冒険) */
    var cta = btn && btn.primaryCTA
      ? btn.primaryCTA({ label:"今日の冒険", sub:size+"問 · 約"+mins+"分", action:"startToday" })
      : '<button type="button" class="btn btn--primary cta" data-action="startToday"><span class="cta__label">今日の冒険</span></button>';

    /* ② StatusStrip(連続日数 / 復習due / 悪魔到達度ゲージ) */
    var gauge = pb && pb.progressbar
      ? pb.progressbar({ value:readiness, max:100, variant:"accent", label:"悪魔到達度" })
      : '';
    var strip = '<div class="status-strip">'
      + tile("🔥", "連続", streak + "日")
      + tile("📅", "復習", due + "問")
      + '<div class="status-tile status-tile--gauge">'
        + '<div class="status-tile__label">👹 悪魔到達度</div>'
        + gauge
        + '<div class="status-tile__val status-tile__val--sm">' + esc(readiness) + '%</div>'
      + '</div>'
      + '</div>';

    /* ③ NextHint(1行・テキストのみ=別CTAにしない) */
    var nh = hint ? ('<div class="next-hint">💡 <span>' + esc(hint) + '</span></div>') : '';

    return '<section class="screen screen--home" data-screen="home">'
         + '<div class="home-cta">' + cta + '</div>'
         + strip
         + nh
         + '</section>';
  }

  /* ---- 登録: 新 screen「home」+ enter 副作用(achチェック) ---- */
  if(APP.router && typeof APP.router.register==="function"){ APP.router.register("home", render); }
  if(APP.lifecycle && typeof APP.lifecycle.onEnter==="function"){
    APP.lifecycle.onEnter("home", function(){
      /* BGMシーンは lifecycle が SCENE(home→town) を自動適用。ここは達成チェックのみ。 */
      try{
        if(typeof G.achCheck==="function") G.achCheck();
        else if(typeof G.achCheckUnlock==="function") G.achCheckUnlock();
      }catch(e){}
    });
  }

  APP.screens = APP.screens || {};
  APP.screens.home = { render:render };
})();
