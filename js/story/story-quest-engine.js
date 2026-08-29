"use strict";
/* ============================================================
   story/story-quest-engine.js — 物語クエストの登録簿・進行
   既存 msqAdvance() を壊さず、その後段で「物語クエスト」を進める。
   純ロジック（DOM 非依存）。docs/story-architecture.md §1 準拠。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  S.QUESTS = S.QUESTS || {};

  /* 章データが自身のクエスト定義を登録する
     def = { title, chapter, steps:[...], reward?, doneFlag? } */
  S.registerQuest = function(qid, def){
    if(typeof qid==="string" && def && typeof def==="object"){ S.QUESTS[qid] = def; }
  };

  /* ST.sq.quests と定義を突き合わせ、完了フラグ済みのクエストを done へ進める。
     msqAdvance()（既存メインクエスト進行）とは独立に動く後段フック。 */
  S.advanceQuests = function(){
    var sq = S.state();
    for(var qid in S.QUESTS){
      var def = S.QUESTS[qid]; if(!def) continue;
      var q = sq.quests[qid]; if(!q) continue;
      if(def.doneFlag && S.hasFlag(def.doneFlag) && q.state!=="done"){ q.state = "done"; }
    }
  };

  /* 表示用バッジ */
  S.questBadge = function(qid){
    var def = S.QUESTS[qid], q = S.questState(qid);
    var steps = (def && Array.isArray(def.steps)) ? def.steps.length : 0;
    return {
      title: (def && typeof def.title==="string") ? def.title : qid,
      state: q.state, step: q.step, steps: steps
    };
  };

  /* 進行中クエストid配列 */
  S.questsActive = function(){
    var sq = S.state(), out = [];
    for(var k in sq.quests){ if(sq.quests[k].state==="active") out.push(k); }
    return out;
  };
})();
