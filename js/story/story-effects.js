"use strict";
/* ============================================================
   story/story-effects.js — effects 適用（eval禁止・データ駆動）
   flags / ideologyChanges / relationshipChanges / evidence / questUpdate / reward。
   ・1ノード=1トランザクション（部分適用でも壊れない）。適用後 SRStory.save()。
   ・reward はノードid単位で重複防止（再訪でも二重付与しない）。
   ・既存 ST.coins/xp/chests へ加算（既存計算に一致。addXpRaw があれば委譲）。
   docs/story-architecture.md §1/§5 準拠。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};
  function isObj(v){ return !!v && typeof v==="object" && !Array.isArray(v); }
  function has(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }

  function applyFlags(m){ if(!isObj(m)) return; for(var k in m){ if(has(m,k)) S.setFlag(k, m[k]); } }
  function applyIdeo(m){ if(!isObj(m)) return; for(var k in m){ if(has(m,k)) S.addIdeo(k, m[k]); } }
  function applyRel(m){ if(!isObj(m)) return; for(var k in m){ if(has(m,k)) S.addRel(k, m[k]); } }

  function applyEvidence(e){
    if(e==null) return [];
    var arr = Array.isArray(e) ? e : [e], out = [];
    for(var i=0;i<arr.length;i++){ var id = arr[i];
      if(typeof id==="string" && S.addEvidence(id)) out.push(id); }
    return out;
  }

  function applyQuest(q){
    if(!isObj(q) || typeof q.qid!=="string") return;
    S.setQuest(q.qid, q.state, q.step);
    if(typeof S.advanceQuests==="function"){ try{ S.advanceQuests(); }catch(e){} }
  }

  /* reward: ノードid単位で一度だけ付与（_rw_<id> フラグで冪等化） */
  function grantReward(node, rw){
    if(!isObj(rw)) return false;
    var id = node && typeof node.id==="string" ? node.id : "";
    var key = "_rw_" + id;
    if(id && S.hasFlag(key)) return false;   /* 既に付与済み */
    var st = G.gameState; if(!isObj(st)) return false;
    var coins = Math.trunc(Number(rw.coins))||0;
    var xp    = Math.trunc(Number(rw.xp))||0;
    var chest = Math.trunc(Number(rw.chest))||0;
    if(coins) st.coins = (Number(st.coins)||0) + coins;
    if(xp){
      if(typeof G.addXpRaw==="function"){ try{ G.addXpRaw(st, xp); }catch(e){ st.xp = (Number(st.xp)||0)+xp; } }
      else st.xp = (Number(st.xp)||0) + xp;
    }
    if(chest) st.chests = (Number(st.chests)||0) + chest;
    if(id) S.setFlag(key, 1);
    return true;
  }

  /* ノード（または合成ノード=選択肢）の effects を適用。{evidenceGained,rewardGranted} を返す */
  S.applyEffects = function(node, ctx){
    var out = { evidenceGained:[], rewardGranted:false };
    if(!isObj(node)) return out;
    var eff = isObj(node.effects) ? node.effects : {};

    applyFlags(node.flags); applyFlags(eff.flags);
    applyIdeo(node.ideologyChanges); applyIdeo(eff.ideologyChanges); applyIdeo(eff.ideology);
    applyRel(node.relationshipChanges); applyRel(eff.relationshipChanges); applyRel(eff.rel);
    out.evidenceGained = applyEvidence(node.evidence).concat(applyEvidence(eff.evidence));
    applyQuest(node.questUpdate); applyQuest(eff.questUpdate);

    var rw = node.reward || eff.reward;
    if(rw) out.rewardGranted = grantReward(node, rw);

    if(typeof node.id==="string") S.markSeen(node.id);
    S.save();
    return out;
  };
})();
