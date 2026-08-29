"use strict";
/* ============================================================
   learning/scheduler.js — SRS(間隔反復 + SM-2ライト)の純ロジック層
   engine.js:252-306 を【無改変移植】。固定日数化しない(SRS_IV/ease伸縮を維持)。
   DOM/Store非依存: 引数の st(問題別統計)と today(=todayNum 相当)だけで動く。
   旧 srsOnCorrect/srsOnWrong は ST.cnt.rev++ の副作用を持っていたが、純化のため
   その集計は返り値(wasDue)に委ね、呼び出し側(scoring/commit)がカウンタへ反映する。
   数値(box/due/ease/la)の更新式は旧と1バイトも変えない=parityで固定。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var L = G.SRLearning = G.SRLearning || {};

  /* --- 定数(engine.js と完全一致・固定日数化しない) --- */
  var SRS_IV=[1,3,7,16,35,70];        /* 初期梯子(Leitner)。box上位ではeaseで伸縮 */
  var EASE_DEF=2.3, EASE_MIN=1.3, EASE_MAX=3.0;
  var EASE_FROM=3;                    /* box>=EASE_FROM から ease で間隔を伸縮 */
  var IV_MAX=365;                     /* 次回間隔の上限(保守) */
  var LEECH_W=5;                      /* 誤答がこの回数を超えたら「沼問題」 */

  function clampEase(e){ e=Number(e); if(!Number.isFinite(e))e=EASE_DEF; return e<EASE_MIN?EASE_MIN:(e>EASE_MAX?EASE_MAX:e); }

  /* 正解時のSRS更新(engine.js:260-287 と同一)。wasSeen=この回答より前に解いた経験の有無。
     戻り値 wasDue(期限到来の復習を後日正解したか)。st を破壊的に更新する。 */
  function srsOnCorrect(st, wasSeen, today){
    var tdn = today;
    if(st.la===tdn) return false;                 /* 同日重複はSRS前進なし */
    var wasDue = !!wasSeen && (st.due||0)<=tdn;
    var prevLa = st.la;
    st.ease = clampEase(st.ease);
    st.box = Math.min((st.box||0)+1, SRS_IV.length-1);
    var gap = (wasSeen && prevLa>0) ? (tdn-prevLa) : 0;
    var iv = SRS_IV[st.box];
    if(st.box>=EASE_FROM){
      if(gap>=SRS_IV[st.box]) st.ease=clampEase(st.ease+0.15);      /* 予定より長く覚えていた */
      else if(gap>=7) st.ease=clampEase(st.ease+0.08);
      else if(wasDue) st.ease=clampEase(st.ease+0.04);
      iv = Math.round(SRS_IV[st.box]*(st.ease/EASE_DEF));
      if(st.box===SRS_IV.length-1){
        iv = Math.max(iv, Math.round(Math.max(gap,SRS_IV[st.box])*st.ease/EASE_DEF));
      }
      iv = Math.min(iv, IV_MAX);
    }
    iv = Math.max(1, iv);
    st.due = tdn+iv; st.la = tdn;
    return wasDue;
  }

  /* 誤答時のSRS更新(engine.js:288-293 と同一)。1段階だけ降格(0全リセットしない)。 */
  function srsOnWrong(st, today){
    var tdn = today;
    st.ease = clampEase(clampEase(st.ease)-0.2);   /* 誤答でeaseを下げる(下限EASE_MIN) */
    st.box = Math.max(0, (st.box||0)-1);           /* 1段階だけ降格 */
    st.due = tdn+1; st.la = tdn;
  }

  /* 長期記憶ボーナス(engine.js:302-306 と同一)。la更新前に呼ぶこと。 */
  function memBonusMult(st, wasSeen, today){
    if(!wasSeen || !(st.la>0)) return 1;
    var gap = today - st.la;
    return gap>=30 ? 2 : gap>=7 ? 1.5 : 1;
  }

  /* 沼問題(何度も誤答)判定。st を受ける純関数(engine.js:295) */
  function isLeech(st){ return !!st && (st.w||0)>=LEECH_W; }

  /* 復習期限が来ているか(engine.js dueIds の1件版)。学習履歴が有り(c+w>0)期限到来 */
  function isDue(st, today){ return !!st && ((st.c||0)+(st.w||0)>0) && (st.due||0)<=today; }

  L.scheduler = {
    SRS_IV:SRS_IV, EASE_DEF:EASE_DEF, EASE_MIN:EASE_MIN, EASE_MAX:EASE_MAX,
    EASE_FROM:EASE_FROM, IV_MAX:IV_MAX, LEECH_W:LEECH_W,
    clampEase:clampEase, srsOnCorrect:srsOnCorrect, srsOnWrong:srsOnWrong,
    memBonusMult:memBonusMult, isLeech:isLeech, isDue:isDue
  };
})();
