"use strict";
/* ============================================================
   learning/schema.js — 問題別学習統計 q[id] の型と初期化(純)
   フィールド名は現 ST.q[id] / state/slices/learning.js の defaultQStat と【完全一致=凍結】。
   c/w/ng/s/bm/box/due/la/ease/mr/sa/sac の意味・キーは1バイトも変えない。
   ここは「型の単一の真実」。scheduler/scoring は必ずこの形の st を受け取る。
   DOM/Store非依存(値を組み立てて返すだけ)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var L = G.SRLearning = G.SRLearning || {};

  var EASE_DEF = 2.3; /* scheduler.EASE_DEF と一致 */

  /* 1問の学習記録の初期値。engine.js:259 qstat() / slice defaultQStat と同型。 */
  function defaultQStat(){
    return { c:0, w:0, ng:false, s:0, bm:false, box:0, due:0, la:0, ease:EASE_DEF, mr:{}, sa:-1, sac:0 };
  }

  /* qmap から st を取得。無ければ default を積んで返す(qstat 相当・純: 引数の map を変異)。
     "答えを当てる" 情報は一切持たない(学習事実のみ)。 */
  function ensureStat(qmap, id){
    id = String(id);
    if(!qmap[id]) qmap[id] = defaultQStat();
    return qmap[id];
  }

  /* 既存 st の欠損キーを default で穴埋め(破壊せず新オブジェクトを返す)。旧セーブ後方互換の芯。 */
  function withDefaults(st){
    var d = defaultQStat(), o = (st && typeof st==="object") ? st : {};
    return {
      c:  ("c"  in o)?o.c :d.c,  w:  ("w"  in o)?o.w :d.w,  ng: ("ng" in o)?o.ng:d.ng,
      s:  ("s"  in o)?o.s :d.s,  bm: ("bm" in o)?o.bm:d.bm, box:("box"in o)?o.box:d.box,
      due:("due"in o)?o.due:d.due, la:("la" in o)?o.la:d.la, ease:("ease"in o)?o.ease:d.ease,
      mr: ("mr" in o)?o.mr :d.mr, sa: ("sa" in o)?o.sa :d.sa, sac:("sac"in o)?o.sac:d.sac
    };
  }

  L.schema = { defaultQStat:defaultQStat, ensureStat:ensureStat, withDefaults:withDefaults, EASE_DEF:EASE_DEF };
})();
