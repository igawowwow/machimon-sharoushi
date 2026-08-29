"use strict";
/* ============================================================
   story/story-evidence-engine.js — 推理（証拠の組合せ=仮説）と交渉（条文選択）の判定
   ・問題の採点(learning/scoring)は一切変えない。所持証拠と選択の一致のみ判定する表示レイヤー。
   純ロジック（DOM 非依存）。docs/story-architecture.md §1/§5 準拠。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  function conf(node, key){
    if(!node || typeof node!=="object") return {};
    if(node[key] && typeof node[key]==="object") return node[key];
    if(node.judge && typeof node.judge==="object") return node.judge;
    return {};
  }

  /* 推理: node.reasoning = { need:["ev1",...], allowExtra? }。
     need の全証拠を「所持」かつ「選択」し、余計な選択が無ければ ok（allowExtra で余剰許容）。 */
  S.reasoning = function(node, picks){
    var c = conf(node, "reasoning");
    var need = Array.isArray(c.need) ? c.need : (Array.isArray(c.correct) ? c.correct : []);
    picks = Array.isArray(picks) ? picks : [];
    var pickSet = {}, needSet = {};
    picks.forEach(function(p){ pickSet[String(p)] = 1; });
    need.forEach(function(n){ needSet[String(n)] = 1; });
    var missing = need.filter(function(n){ return !pickSet[String(n)] || !S.hasEvidence(n); });
    var extra = picks.filter(function(p){ return !needSet[String(p)]; });
    var ok = missing.length===0 && (!!c.allowExtra || extra.length===0);
    return { ok:ok, correct:need.slice(), missing:missing, extra:extra };
  };

  /* 交渉: node.negotiation = { answer:"idx_or_key" }。正しい条文/制度の選択と一致すれば ok。 */
  S.negotiation = function(node, pick){
    var c = conf(node, "negotiation");
    var answer = (c.answer!=null) ? c.answer : c.correct;
    var ok = (pick!=null) && (answer!=null) && String(pick)===String(answer);
    return { ok:ok, answer:answer };
  };
})();
