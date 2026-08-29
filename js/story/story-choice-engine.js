"use strict";
/* ============================================================
   story/story-choice-engine.js — 選択肢の条件フィルタと選択適用（純ロジック）
   ・conditions を満たす choice のみ可視化。UI 描画（data-action / esc）は R3。
   ・選択は合成ノードとして effects を適用し、next を解決する。
   docs/story-architecture.md §1/§4 準拠。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  /* 表示すべき選択肢（元の添字を保持）。条件未達は除外。 */
  S.visibleChoices = function(node){
    if(!node || !Array.isArray(node.choices)) return [];
    var out = [];
    node.choices.forEach(function(c, idx){
      if(!c || typeof c!=="object") return;
      if(c.conditions!=null && !S.evalConditions(c.conditions)) return;
      out.push({ idx:idx, text:(typeof c.text==="string"?c.text:""), choice:c });
    });
    return out;
  };

  /* 選択肢を適用: choice の effects を合成ノードとして適用し、遷移先 nodeId を返す（無ければ null）。
     条件未達の選択は null（不正選択を通さない）。 */
  S.pickChoice = function(node, idx){
    if(!node || !Array.isArray(node.choices)) return null;
    var c = node.choices[idx];
    if(!c || typeof c!=="object") return null;
    if(c.conditions!=null && !S.evalConditions(c.conditions)) return null;
    S.applyEffects({
      id: (node.id ? node.id + "#" + idx : null),
      flags: c.flags, effects: c.effects,
      ideologyChanges: c.ideologyChanges,
      relationshipChanges: c.relationshipChanges,
      evidence: c.evidence, questUpdate: c.questUpdate,
      reward: c.reward
    });
    var nx = (typeof S._resolveNext==="function") ? S._resolveNext(c.next) : null;
    return nx;
  };
})();
