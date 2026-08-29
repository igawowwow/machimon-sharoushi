"use strict";
/* ============================================================
   app/lifecycle.js — 画面 enter/leave フック(Phase3b 基盤)
   ・enter(route,prev): BGMシーン適用(受け皿) + enterフック実行
   ・leave(route): タイマ停止(受け皿) + leaveフック実行
   副作用(setBgmScene 直呼び等)を screen 本体から剥がし1箇所へ集約する土台。
   この Phase では router を自動起動しないため、旧UIのBGM/タイマには一切干渉しない。
   非module classic script。名前空間 window.SRApp。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  /* screenId → BGMシーン(後Phaseで game/audio-scenes.js へ移送する暫定マップ) */
  var SCENE = {
    home:"town", more:"town", office:"town",
    world:"field", adventure:"field", subject:"field",
    battle:"battle", boss:"boss",
    result:"victory",
    equip:"town", gacha:"town", companions:"town",
    bestiary:"town", collection:"town", law:"town", achievements:"town"
  };

  var enterHooks = {};   // screenId -> [fn(route,prev)]
  var leaveHooks = {};   // screenId -> [fn(route)]
  var timers = [];       // 画面が張ったタイマ(leave で一括停止する受け皿)

  function run(list, a, b){
    if(!list) return;
    for(var i=0;i<list.length;i++){ try{ list[i](a,b); }catch(e){} }
  }

  var Lifecycle = {
    scenes: SCENE,

    onEnter: function(screenId, fn){
      if(!screenId || typeof fn!=="function") return this;
      (enterHooks[screenId] = enterHooks[screenId] || []).push(fn); return this;
    },
    onLeave: function(screenId, fn){
      if(!screenId || typeof fn!=="function") return this;
      (leaveHooks[screenId] = leaveHooks[screenId] || []).push(fn); return this;
    },

    sceneFor: function(screenId){ return SCENE[screenId] || null; },

    /* 画面到達: BGMシーン適用 + '*'/screen の enter フック */
    enter: function(route, prev){
      if(!route) return;
      this.applyScene(route.screen);
      run(enterHooks["*"], route, prev);
      run(enterHooks[route.screen], route, prev);
    },
    /* 画面退出: タイマ停止 + '*'/screen の leave フック */
    leave: function(route){
      if(!route) return;
      run(leaveHooks[route.screen], route);
      run(leaveHooks["*"], route);
      this.clearTimers();
    },

    /* BGMシーン適用(旧 setBgmScene があれば委譲。無ければ no-op = throw しない) */
    applyScene: function(screenId){
      var scene = SCENE[screenId]; if(!scene) return;
      try{ if(typeof G.setBgmScene==="function") G.setBgmScene(scene); }catch(e){}
    },

    /* タイマ受け皿(画面が張った interval/timeout を leave で一括停止) */
    addTimer: function(id){ if(id!=null) timers.push(id); return id; },
    clearTimers: function(){
      while(timers.length){
        var id = timers.pop();
        try{ if(typeof G.clearInterval==="function") G.clearInterval(id); }catch(e){}
        try{ if(typeof G.clearTimeout==="function") G.clearTimeout(id); }catch(e){}
      }
    },
    _timerCount: function(){ return timers.length; }
  };

  APP.lifecycle = Lifecycle;
})();
