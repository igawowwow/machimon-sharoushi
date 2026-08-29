"use strict";
/* ============================================================
   story/story-schema.js — ストーリーノードの型・enum・バリデータ
   純ロジック（DOM/ST 非依存）。実行時 throw しない設計。
   docs/story-architecture.md §2 準拠。名前空間 window.SRStory。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};

  /* ノード種別（architecture NODE_TYPES） */
  S.NODE_TYPES = ["dialogue","choice","encounter","evidence","reasoning",
                  "negotiation","cutscene","branch","end"];

  /* 思想値6軸と初期値（story-bible §2）。善悪ゲージにしない内部値 0..10 */
  S.IDEO_AXES = ["law","human","mgmt","fair","relief","indep"];
  S.IDEO_INIT = { law:6, human:3, mgmt:1, fair:3, relief:5, indep:2 };
  S.IDEO_MIN = 0;
  S.IDEO_MAX = 10;

  function isObj(v){ return !!v && typeof v==="object" && !Array.isArray(v); }
  function isNeStr(v){ return typeof v==="string" && v.length>0; }
  S._isObj = isObj;

  /* next はデータのみ: 文字列 or {then,else} or null（関数/コード文字列を持たせない=eval禁止の徹底） */
  function validNext(n){
    if(n==null) return true;
    if(typeof n==="string") return true;
    if(isObj(n)){
      if(n.then!=null && typeof n.then!=="string") return false;
      if(n.else!=null && typeof n.else!=="string") return false;
      return true;
    }
    return false;
  }

  /* 実行時 throw しない検証。{ok, errors[]} を返す */
  S.validateNode = function(node){
    var errors = [];
    if(!isObj(node)) return { ok:false, errors:["node must be a plain object"] };
    if(!isNeStr(node.id)) errors.push("id required (non-empty string)");
    if(S.NODE_TYPES.indexOf(node.type) < 0) errors.push("type invalid: "+String(node.type));
    if(!validNext(node.next)) errors.push("next must be string|{then,else}|null");
    switch(node.type){
      case "dialogue":
        if(!isNeStr(node.speaker)) errors.push("dialogue: speaker required");
        if(typeof node.text!=="string") errors.push("dialogue: text required");
        break;
      case "choice":
        if(!Array.isArray(node.choices) || node.choices.length===0){
          errors.push("choice: choices[] required");
        } else {
          node.choices.forEach(function(c,i){
            if(!isObj(c)) errors.push("choice["+i+"] must be object");
            else if(typeof c.text!=="string") errors.push("choice["+i+"].text required");
          });
        }
        break;
      case "encounter":
        if(!isObj(node.encounter)) errors.push("encounter: encounter{} required");
        break;
      case "evidence":
        if(node.evidence==null) errors.push("evidence: evidence (id|id[]) required");
        break;
      case "branch":
        if(!isObj(node.next) || (node.next.then==null && node.next.else==null)){
          errors.push("branch: next.{then,else} required");
        }
        break;
      case "end":
        if(!isNeStr(node.ending)) errors.push("end: ending id required");
        break;
      /* reasoning / negotiation / cutscene: 判定/演出データは任意（UIレイヤーで解釈） */
    }
    return { ok: errors.length===0, errors: errors };
  };

  /* 終端判定: end、または前進先が一切ないノード（choice/branch は分岐先を持つので非終端） */
  S.isTerminal = function(node){
    if(!isObj(node)) return true;
    if(node.type==="end") return true;
    if(node.type==="choice" && Array.isArray(node.choices) && node.choices.length>0) return false;
    if(node.type==="branch") return false;
    return node.next==null;
  };
})();
