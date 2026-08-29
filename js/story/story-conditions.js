"use strict";
/* ============================================================
   story/story-conditions.js — conditions 評価（eval禁止・データ述語のみ）
   全キー AND。all/any/not で入れ子可。未知キーは false（安全側）。throw しない。
   docs/story-architecture.md §1 準拠。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  function num(v){ v = Number(v); return Number.isFinite(v) ? v : NaN; }

  /* {axis:n,...} を全て満たすか。空オブジェクトは false（無意味な述語を通さない） */
  function objCmp(o, fn){
    if(!o || typeof o!=="object" || Array.isArray(o)) return false;
    var ks = Object.keys(o);
    if(!ks.length) return false;
    for(var i=0;i<ks.length;i++){ if(!fn(ks[i], num(o[ks[i]]))) return false; }
    return true;
  }

  /* 現在章番号は進行の真実源 ST.msq.ch を参照（sq.chapter は表示用文字列のため使わない） */
  function chapterNum(){
    var st = (G.gameState && typeof G.gameState==="object") ? G.gameState : {};
    var m = st.msq;
    return (m && Number.isFinite(m.ch)) ? m.ch : 0;
  }

  function evalKey(k, v){
    switch(k){
      case "all": return Array.isArray(v) && v.every(function(c){ return S.evalConditions(c); });
      case "any": return Array.isArray(v) && v.some(function(c){ return S.evalConditions(c); });
      case "not": return !S.evalConditions(v);
      case "flag": return S.hasFlag(v);
      case "noflag": return !S.hasFlag(v);
      case "seen": return S.isSeen(v);
      case "hasEvidence": return S.hasEvidence(v);
      case "evidenceCount": { var n = num(v); return Number.isFinite(n) && S.evidenceCount() >= n; }
      case "questDone": return S.questState(v).state === "done";
      case "questActive": return S.questState(v).state === "active";
      case "ideoMin": return objCmp(v, function(axis,n){ return Number.isFinite(n) && S.getIdeo(axis) >= n; });
      case "ideoMax": return objCmp(v, function(axis,n){ return Number.isFinite(n) && S.getIdeo(axis) <= n; });
      case "relMin": return objCmp(v, function(id,n){ return Number.isFinite(n) && S.getRel(id) >= n; });
      case "chapterAtLeast": { var c = num(v); return Number.isFinite(c) && chapterNum() >= c; }
      default: return false;   /* 未知キーは安全側で false */
    }
  }

  /* cond: null(=無条件true) | object(全キーAND) | array(全要素AND) */
  S.evalConditions = function(cond, st){
    if(cond==null) return true;
    if(Array.isArray(cond)){
      for(var i=0;i<cond.length;i++){ if(!S.evalConditions(cond[i])) return false; }
      return true;
    }
    if(typeof cond!=="object") return false;
    var keys = Object.keys(cond);
    if(!keys.length) return true;   /* 空条件は無条件通過 */
    for(var j=0;j<keys.length;j++){ if(!evalKey(keys[j], cond[keys[j]])) return false; }
    return true;
  };
})();
