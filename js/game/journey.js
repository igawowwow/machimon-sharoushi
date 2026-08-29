"use strict";
/* ============================================================
   game/journey.js — 悪魔への道(メタ進行の背骨)の純ロジック層(DOM非依存)
   ------------------------------------------------------------
   北極星は一つ=【試験の悪魔(本試験の化身)】を倒すこと。
   ui-journey.js の journeyPillars/demonReadiness/readinessTier/nextBestAction を
   DOM/ST/グローバル依存から引き剥がし、env アクセサ経由の純関数に抽出した。
   Home(screens/home)と冒険タブ(screens/adventure)の両方がこの1つを参照する。
   ・攻略度(readiness)は "表示専用" の羅針盤。悪魔戦は装備無効の実力勝負(isExam)なので
     この数値が上がっても答えが当たりやすくなることは無い=学習の芯を壊さない。
   ・重みは知識(定着)を最重視(0.40)。知識+帝国+図鑑(=学習駆動)で 0.67、支援系で 0.33。
   ・全入力は 0除算防止・欠損は 0 扱い。育成が進むほど readiness は単調増加。
   移植元: ui-journey.js:17-84(jrPct/pillars/readiness/tier/nextBestAction)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SG = G.SRGame = G.SRGame || {};

  function numOr(v,d){ v=Number(v); return Number.isFinite(v)?v:d; }
  /* 0除算せず 0..100 の整数% に丸める(ui-journey.js:17 jrPct と同一) */
  function jrPct(cur,max){ max=numOr(max,0); if(!(max>0)) return 0;
    return Math.max(0, Math.min(100, Math.round(numOr(cur,0)/max*100))); }

  /* env = {
       passPct:0..100,                    // 知識の定着(mastery.passPct)
       empireDone:0..9,                   // 帝国制圧(攻略した科目数)
       power:number, powerReq:number,     // 戦力(装備) / 目標戦力
       officeRank:number, officeMax:number,
       party:number, partyMax:number,
       bestiaryPct:0..100, itemPct:0..100 // 図鑑
     } すべて欠損時 0 扱い。 */
  function journeyPillars(env){
    env = env || {};
    var pass = Math.max(0, Math.min(100, numOr(env.passPct,0)));
    var empireDone = numOr(env.empireDone,0);
    var power = numOr(env.power,0), powerReq = Math.max(1, numOr(env.powerReq,320));
    var officeRank = numOr(env.officeRank,0), officeMax = Math.max(1, numOr(env.officeMax,4));
    var party = numOr(env.party,0), partyMax = Math.max(1, numOr(env.partyMax,9));
    var col = Math.round((numOr(env.bestiaryPct,0) + numOr(env.itemPct,0)) / 2);
    return [
      { key:"know",   icon:"📖",  name:"知識の定着",        w:0.40, cur:pass,                     max:100,      pct:jrPct(pass,100),
        help:"本試験そのもの。悪魔に最も効く",       goLabel:"おすすめ20問で鍛える" },
      { key:"empire", icon:"🗺️", name:"帝国制圧(科目攻略)", w:0.20, cur:Math.min(empireDone,9),   max:9,        pct:jrPct(empireDone,9),
        help:"9科目をまんべんなく攻略する道",         goLabel:"冒険の地図へ" },
      { key:"power",  icon:"⚔",  name:"戦力(装備)",        w:0.15, cur:Math.min(power,powerReq),  max:powerReq, pct:jrPct(power,powerReq),
        help:"苦戦を減らし、修行がぐっと捗る",         goLabel:"装備を鍛える" },
      { key:"office", icon:"🏢",  name:"事務所",            w:0.10, cur:Math.min(officeRank,officeMax), max:officeMax, pct:jrPct(officeRank,officeMax),
        help:"顧問料でコイン→装備・ガチャに還元",     goLabel:"事務所を育てる" },
      { key:"party",  icon:"🤝",  name:"仲間",              w:0.08, cur:Math.min(party,partyMax),  max:partyMax, pct:jrPct(party,partyMax),
        help:"常時ボーナスで冒険を後押し",            goLabel:"仲間を見る" },
      { key:"zukan",  icon:"📚",  name:"図鑑コンプ",        w:0.07, cur:col,                       max:100,      pct:Math.max(0,Math.min(100,col)),
        help:"敵と装備を知り尽くす収集の道",          goLabel:"図鑑を埋める" }
    ];
  }

  /* 攻略度(0..100)= Σ 重み×柱の%(ui-journey.js:53 と同一)。育成が進むほど単調増加。 */
  function demonReadiness(env){
    var s = journeyPillars(env).reduce(function(a,p){ return a + p.w*p.pct; }, 0);
    return Math.max(0, Math.min(100, Math.round(s)));
  }

  /* 攻略度→段差(手応えの層)。ui-journey.js:58 と同一のしきい値。 */
  function readinessTier(r){
    if(r>=80) return { t:"合格圏 ― 悪魔を討てる", c:"#2B9E82" };
    if(r>=60) return { t:"合格ラインが見えた",     c:"#2B62D9" };
    if(r>=30) return { t:"挑戦圏 ― 善戦できる",     c:"#C58900" };
    return       { t:"旅立ちの途上",               c:"#8A8494" };
  }

  /* いま一番おすすめの「次の一手」。ui-journey.js:65 の純化版。
     env.intro={easy,met,win}, env.dueCount, env.step={label,cta,btn}(msqStepInfo 相当) */
  function nextBestAction(env){
    env = env || {};
    var intro = env.intro;
    if(intro){
      if(!intro.easy) return { label:"はじまりの試練で最初の一勝を挙げる", cta:"introStart()", btn:"試練に挑む", icon:"skull" };
      if(!intro.met)  return { label:"試験の悪魔と対峙する",               cta:"startDemon()", btn:"悪魔に挑む", icon:"mao" };
    }
    var due = numOr(env.dueCount,0);
    if(due>0) return { label:"記憶の綻びを繕う(復習"+due+"問・XP2倍)", cta:"startReview()", btn:"復習する", icon:"ghost" };
    if(env.step && env.step.label) return { label:env.step.label, cta:env.step.cta, btn:env.step.btn, icon:"excal" };
    return { label:"おすすめ20問で知識を鍛える", cta:"startReco()", btn:"鍛える", icon:"scroll" };
  }

  SG.journey = {
    jrPct: jrPct, journeyPillars: journeyPillars, demonReadiness: demonReadiness,
    readinessTier: readinessTier, nextBestAction: nextBestAction
  };
})();
