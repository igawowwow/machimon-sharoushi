"use strict";
/* ============================================================
   app/actions/startToday.js — 単一CTA「今日の冒険」の実体(Phase4c)
   ------------------------------------------------------------
   §3.3(単一CTA原則): ホームの Primary CTA は「今日の冒険」1つ。
   startToday():
     recommendation.buildSession(size:courseLen, mix:60/30/10)   ← システムが選ぶ
       → battle-engine.encounterFor("today", session)             ← Encounter記述子
       → router.go({tab:'adventure', screen:'battle', params})    ← 学習へ突入
   ・ユーザーにモードを選ばせない(自動配合)。
   ・buildSession の候補は全て study プール(kind===study)=本試験形式(examFmt/nendo/case)は
     型として絶対に混入しない。ここでも kind:"study" を params に明示。
   ・DOM を直接触らない(依存方向: screens/app 層 → learning/game を呼ぶだけ)。
   ・env は Store.state(唯一の真実源)+ 問題バンク(Q/QBY/qById/SUBJECTS)から組む。
     問題履歴 statOf は Store.state.learning.q(単一の学習履歴)を参照(qstat 非経由)。
   非module classic script。名前空間 window.SRApp.actions(home/result からも buildEnv を共有)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  /* コース長プリセット(core/course.js と同値)。buildSession が 3〜10 にクランプ。 */
  var PRESET = { short:9, normal:12, long:15 };
  function today(){ return Math.floor(Date.now()/864e5); }
  function clamp(v,min,max){ return v<min?min:(v>max?max:v); }

  /* 今日のセッション問数(設定コース長 → 3〜10 にクランプ) */
  function sessionSize(){
    var st = G.Store && G.Store.state;
    var c = (st && st.settings && st.settings.course) || "normal";
    var n = PRESET[c] || PRESET.normal;
    return clamp(n, 3, 10);
  }

  /* learning/game 純関数へ渡す env を Store + 問題バンクから構築(純関数側は DOM/Store 非依存)。
     Q/QBY/qById/SUBJECTS はクラシックスクリプト共有スコープの束縛(typeof で安全参照)。 */
  function buildEnv(){
    var Store = G.Store;
    var st = Store && Store.state;
    if(!st){ try{ if(Store) Store.load(); }catch(e){} st = Store && Store.state; }
    if(!st) return null;
    var qmap = (st.learning && st.learning.q) || {};
    var study = (typeof Q!=="undefined" && Q) ? Q : [];
    var subs  = (typeof SUBJECTS!=="undefined" && SUBJECTS) ? SUBJECTS : [];
    var all   = study;
    try{ if(typeof QBY!=="undefined" && QBY && typeof QBY.values==="function"){ all = Array.prototype.slice.call([]); all = []; QBY.forEach(function(v){ all.push(v); }); } }catch(e){ all = study; }
    return {
      study: study,
      all: (all && all.length) ? all : study,
      statOf: function(id){ return qmap[String(id)]; },
      byId: function(id){ return (typeof qById==="function") ? qById(id) : null; },
      today: today(),
      subjects: subs,
      rng: Math.random,
      clears: (st.adventure && st.adventure.clears) || 0
    };
  }

  /* 単一CTAの実体 */
  function startToday(){
    var L = G.SRLearning, SG = G.SRGame;
    if(!L || !L.recommendation || !SG || !SG.battle) return null;
    var env = buildEnv();
    if(!env) return null;
    var session = L.recommendation.buildSession(env, sessionSize(), { review:0.6, "new":0.3, challenge:0.1 });
    var enc = SG.battle.encounterFor("today", session);
    var R = APP.router;
    /* kind:"study" を明示 = 通常セッション(本試験形式は型で非混入) */
    if(R && typeof R.go==="function"){
      R.go({ tab:"adventure", screen:"battle", params:{ kind:"study", enc:enc, session:session } });
    }
    return { session:session, enc:enc };
  }

  APP.actions = APP.actions || {};
  APP.actions.startToday = startToday;
  APP.actions.buildEnv = buildEnv;
  APP.actions.sessionSize = sessionSize;

  /* actionMap へ登録(data-action="startToday" 単一委譲で発火) */
  if(APP.events && typeof APP.events.on==="function"){ APP.events.on("startToday", startToday); }
})();
