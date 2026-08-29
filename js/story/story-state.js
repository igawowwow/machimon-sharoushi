"use strict";
/* ============================================================
   story/story-state.js — ST.sq（story quest 状態）の唯一の窓口
   ・旧セーブ安全補完（sq 無し/壊れでも既定を返し起動不能にしない）
   ・保存は engine.js saveST() へ委譲（新経路を作らない）
   ・思想値6軸は未書込み時に正典初期値を返す（実値は選択で埋まるまで空）
   docs/story-architecture.md §1/§3 準拠。DOM 非依存。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var S = G.SRStory = G.SRStory || {};
  var isObj = S._isObj || function(v){ return !!v && typeof v==="object" && !Array.isArray(v); };

  function intOr(v,d){ var n = Math.trunc(Number(v)); return Number.isFinite(n) ? n : d; }
  function clamp(v,lo,hi){ return v<lo?lo:(v>hi?hi:v); }
  var QSTATES = ["none","active","done"];

  /* ---- sq の既定形（architecture §3.1 ＋ char=キャラ作成の一度きり保持） ---- */
  S.defaultSq = function(){ return {
    ideo:{}, rel:{}, ev:{}, flags:{}, quests:{}, seen:{},
    ending:null, resume:null, chapter:"", ver:1, char:null
  };};

  /* キャラクター作成データ（旧セーブ/壊れ値でも安全。未作成=null）。文字列は長さ上限で切詰め。 */
  function cleanStr(v,n){ v=(typeof v==="string")?v:""; return v.length>n ? v.slice(0,n) : v; }
  function cleanChar(raw){
    if(!isObj(raw)) return null;
    return {
      name:   cleanStr(raw.name,16),
      called: cleanStr(raw.called,16),
      look:   cleanStr(raw.look,24),
      gender: cleanStr(raw.gender,24),
      seed:   cleanStr(raw.seed,24),
      created: raw.created ? 1 : 0
    };
  }

  function cleanIntMap(raw){
    var r = isObj(raw)?raw:{}, o = {};
    for(var k in r){ if(!Object.prototype.hasOwnProperty.call(r,k)) continue;
      var n = Math.trunc(Number(r[k])); if(Number.isFinite(n)) o[k]=n; }
    return o;
  }
  function cleanFlagMap(raw){
    var r = isObj(raw)?raw:{}, o = {};
    for(var k in r){ if(Object.prototype.hasOwnProperty.call(r,k) && r[k]) o[k]=1; }
    return o;
  }
  function cleanQuests(raw){
    var r = isObj(raw)?raw:{}, o = {};
    for(var k in r){ var e=r[k]; if(!isObj(e)) continue;
      o[k] = { state:(QSTATES.indexOf(e.state)>=0?e.state:"active"), step:intOr(e.step,0) }; }
    return o;
  }
  function cleanResume(raw){
    if(!isObj(raw)) return null;
    if(typeof raw.chapterId!=="string" || typeof raw.nodeId!=="string") return null;
    return { chapterId:raw.chapterId, nodeId:raw.nodeId };
  }

  /* 壊れ/欠損セーブでも安全な sq を返す（idempotent = 往復不変） */
  S.sanitizeSq = function(raw){
    var r = isObj(raw)?raw:{};
    return {
      ideo:cleanIntMap(r.ideo), rel:cleanIntMap(r.rel),
      ev:cleanFlagMap(r.ev), flags:cleanFlagMap(r.flags),
      quests:cleanQuests(r.quests), seen:cleanFlagMap(r.seen),
      ending:(typeof r.ending==="string" ? r.ending : null),
      resume:cleanResume(r.resume),
      chapter:(typeof r.chapter==="string" ? r.chapter : ""),
      ver:intOr(r.ver,1),
      char:cleanChar(r.char)
    };
  };

  /* ---- 真実源（旧UIは window.gameState=ST）への窓口。engine 未ロードでも安全 ---- */
  function root(){
    var st = G.gameState;
    if(!isObj(st)){ st = G.gameState = {}; }
    if(!isObj(st.sq)){ st.sq = S.defaultSq(); }
    return st;
  }

  /* ST.sq を返す（サブキー欠損はデータを落とさず補完） */
  S.state = function(){
    var sq = root().sq;
    if(!isObj(sq.ideo)) sq.ideo = {};
    if(!isObj(sq.rel)) sq.rel = {};
    if(!isObj(sq.ev)) sq.ev = {};
    if(!isObj(sq.flags)) sq.flags = {};
    if(!isObj(sq.quests)) sq.quests = {};
    if(!isObj(sq.seen)) sq.seen = {};
    if(sq.ending!=null && typeof sq.ending!=="string") sq.ending = null;
    if(sq.resume!=null && !isObj(sq.resume)) sq.resume = null;
    if(typeof sq.chapter!=="string") sq.chapter = "";
    if(typeof sq.ver!=="number") sq.ver = 1;
    if(sq.char!=null && !isObj(sq.char)) sq.char = null;
    return sq;
  };

  /* ---- キャラクター（E2: 作成は一度きり。sq.char に保持） ---- */
  S.getChar = function(){ var c = S.state().char; return isObj(c) ? c : null; };
  S.charCreated = function(){ var c = S.getChar(); return !!(c && c.created); };
  S.setChar = function(obj){
    if(!isObj(obj)) return;
    var c = cleanChar(obj); if(c) c.created = 1;
    S.state().char = c;
  };

  /* ---- 思想値 ---- */
  S.getIdeo = function(axis){
    var sq = S.state();
    if(Object.prototype.hasOwnProperty.call(sq.ideo, axis)) return sq.ideo[axis];
    return (axis in S.IDEO_INIT) ? S.IDEO_INIT[axis] : 0;
  };
  S.addIdeo = function(axis, d){
    if(S.IDEO_AXES.indexOf(axis) < 0) return;
    var sq = S.state();
    sq.ideo[axis] = clamp(S.getIdeo(axis) + (Math.trunc(Number(d))||0), S.IDEO_MIN, S.IDEO_MAX);
  };

  /* ---- 好感度（キャラ関係）。-100..100 ---- */
  S.getRel = function(id){ var v = S.state().rel[id]; return Number.isFinite(v) ? v : 0; };
  S.addRel = function(id, d){
    if(typeof id!=="string" || !id) return;
    var sq = S.state();
    sq.rel[id] = clamp(S.getRel(id) + (Math.trunc(Number(d))||0), -100, 100);
  };

  /* ---- フラグ ---- */
  S.hasFlag = function(id){ return !!S.state().flags[id]; };
  S.setFlag = function(id, v){
    if(typeof id!=="string" || !id) return;
    var sq = S.state();
    if(v===0 || v===false){ delete sq.flags[id]; } else { sq.flags[id]=1; }
  };

  /* ---- 証拠（物語グローバル: ST.cases とは別名前空間） ---- */
  S.hasEvidence = function(id){ return !!S.state().ev[id]; };
  S.addEvidence = function(id){
    if(typeof id!=="string" || !id) return false;
    var sq = S.state();
    if(sq.ev[id]) return false;   /* 重複取得防止 */
    sq.ev[id] = 1; return true;
  };
  S.evidenceCount = function(){ return Object.keys(S.state().ev).length; };

  /* ---- クエスト ---- */
  S.questState = function(qid){
    var q = S.state().quests[qid];
    return q ? { state:q.state, step:q.step } : { state:"none", step:0 };
  };
  S.setQuest = function(qid, state, step){
    if(typeof qid!=="string" || !qid) return;
    var sq = S.state();
    var cur = sq.quests[qid] || { state:"none", step:0 };
    if(state!=null && QSTATES.indexOf(state)>=0) cur.state = state;
    if(step!=null) cur.step = intOr(step, cur.step);
    sq.quests[qid] = cur;
  };

  /* ---- 既読（ST.story と分離し衝突回避） ---- */
  S.isSeen = function(nodeId){ return !!S.state().seen[nodeId]; };
  S.markSeen = function(nodeId){
    if(typeof nodeId!=="string" || !nodeId) return;
    S.state().seen[nodeId] = 1;
  };

  /* ---- エンディング / 戦闘後復帰トークン / 現在章 ---- */
  S.setEnding = function(id){ if(typeof id==="string") S.state().ending = id; };
  S.ending = function(){ return S.state().ending; };
  S.resume = function(){
    var r = S.state().resume;
    return isObj(r) ? { chapterId:r.chapterId, nodeId:r.nodeId } : null;
  };
  S.setResume = function(ch, node){ S.state().resume = { chapterId:String(ch), nodeId:String(node) }; };
  S.clearResume = function(){ S.state().resume = null; };
  S.setChapter = function(id){ if(typeof id==="string") S.state().chapter = id; };
  S.chapter = function(){ return S.state().chapter; };

  /* ---- 保存: 既存 saveST() へ委譲（無ければ no-op で継続） ---- */
  S.save = function(){ try{ if(typeof G.saveST==="function") G.saveST(); }catch(e){} };
})();
