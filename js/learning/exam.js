"use strict";
/* ============================================================
   learning/exam.js — 本試験形式(examFmt)セッションの組成 + 制限時間(純)
   悪魔/神/模試/年度別(nendo)の「本試験さながら」出題を集約。
   ・kind===study(通常セッション)へは絶対に混ぜない: buildExamSession は pools.examPastIds/
     nendoIds など【本試験プールのみ】から引く。型(kind:"exam")で分離を担保。
   ・制限時間: 五肢択一・選択式(読む量が多い)は本試験ペース(EXAM_CHOICE_T=75秒)。○×は短め。
   移植元: ui-battle.js:19-31(EXAM_CHOICE_T/isMultiOptQ/timeLimit), engine.js:316-325。
   DOM/Store非依存: 引数(q/cfg/env)経由。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var L = G.SRLearning = G.SRLearning || {};

  var EXAM_CHOICE_T = 75; /* 本試験ペースの択一制限(ui-battle.js:19 と一致) */

  /* 五肢択一・選択式(3肢以上=読む量が多い)判定(ui-battle.js:21 と同一)。 */
  function isMultiOptQ(q){
    return !!q && (q.format==="choice" || q.format==="fill_blank" || q.examFmt===true ||
                   (q.choices && q.choices.length>=3));
  }

  /* 本試験系モードの1問あたり制限時間(ui-battle.js:22-31 の exam 部を純化)。
     kind: "mock"|"nendo"|"demon"|"last"。cfg: { demonT?, lastT? }。装備補正は呼び出し側が加算。 */
  function examTimeLimit(kind, q, cfg){
    cfg = cfg || {};
    var multi = isMultiOptQ(q);
    if(kind==="mock")  return multi ? EXAM_CHOICE_T : 20;
    if(kind==="nendo") return multi ? EXAM_CHOICE_T : 20;
    if(kind==="demon"){ var base=(cfg.demonT!=null)?cfg.demonT:12; return multi ? Math.max(EXAM_CHOICE_T, base) : base; }
    if(kind==="last"){ var lb=(cfg.lastT!=null)?cfg.lastT:10; return multi ? Math.max(EXAM_CHOICE_T, lb) : lb; }
    return multi ? EXAM_CHOICE_T : 12;
  }

  /* 本試験系セッションの出題プールを返す(通常プール非混入を型で担保)。
     kind: "demon"|"last" → examPastIds / "nendo" → nendoIds。
     戻り値 { kind:"exam", mode, ids }。ids は本試験プールのみ。shuffle/slice は呼び出し側。 */
  function buildExamSession(mode, env){
    var pools = L.pools, ids;
    if(mode==="nendo") ids = pools.nendoIds(env);
    else ids = pools.examPastIds(env); /* demon/last/mock: examFmt→past */
    return { kind:"exam", mode:mode, ids:ids };
  }

  L.exam = {
    EXAM_CHOICE_T:EXAM_CHOICE_T, isMultiOptQ:isMultiOptQ,
    examTimeLimit:examTimeLimit, buildExamSession:buildExamSession
  };
})();
