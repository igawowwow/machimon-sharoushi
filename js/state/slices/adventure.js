"use strict";
/* state/slices/adventure.js — 背骨(世界地図/科目ボス/メインクエスト/試練)進行
   旧ST: msq,cases,intro,mock,nendo,midboss,loop,clears,cleared,trueWin,survBest,maxCombo,goldSeen,dropPity,badges */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SR = G.SRState = G.SRState || {}; SR.slices = SR.slices || {};
  var U = SR.util;

  function defaultAdventure(){ return {
    msq:{ ch:0, step:0, tgt:null, done:0 },
    cases:{}, intro:{ easy:0, met:0, win:0, best:0 },
    badges:{}, midboss:{},
    loop:1, clears:0, cleared:false, trueWin:0,
    survBest:0, maxCombo:0, goldSeen:0, dropPity:0,
    mock:{ runs:0, best:0, clears:0 }, nendo:{},
    /* sq: 物語エンジン(js/story/*)の進行。旧ST.sq と 1:1 対応(legacy-map で往復)。
       新UI起動でも保存が壊れないよう slice に保持する(architecture §3.2) */
    sq: defaultSq()
  };}

  /* sq の既定形と安全化(idempotent)。旧セーブ/壊れ値でも throw せず正規化。
     story-state.js の sanitizeSq と同一形(モジュール非依存で自己完結) */
  function defaultSq(){ return {
    ideo:{}, rel:{}, ev:{}, flags:{}, quests:{}, seen:{},
    ending:null, resume:null, chapter:"", ver:1, char:null
  };}
  function charStr(v,n){ v=(typeof v==="string")?v:""; return v.length>n?v.slice(0,n):v; }
  function charVal(raw){ var r=U.objOr(raw); if(!(raw&&typeof raw==="object"&&!Array.isArray(raw))) return null;
    return { name:charStr(r.name,16), called:charStr(r.called,16), look:charStr(r.look,24),
             gender:charStr(r.gender,24), seed:charStr(r.seed,24), created:r.created?1:0 }; }
  function intMap(raw){ var r=U.objOr(raw),o={}; for(var k in r){ var n=Math.trunc(Number(r[k])); if(Number.isFinite(n))o[k]=n; } return o; }
  function flagMap(raw){ var r=U.objOr(raw),o={}; for(var k in r){ if(r[k])o[k]=1; } return o; }
  function questMap(raw){ var r=U.objOr(raw),o={},ss=["none","active","done"]; for(var k in r){ var e=U.objOr(r[k]); if(r[k]&&typeof r[k]==="object"&&!Array.isArray(r[k])) o[k]={ state:(ss.indexOf(e.state)>=0?e.state:"active"), step:U.intOr(e.step,0,-1e9,1e9) }; } return o; }
  function resumeVal(raw){ var r=U.objOr(raw); return (typeof r.chapterId==="string"&&typeof r.nodeId==="string")?{chapterId:r.chapterId,nodeId:r.nodeId}:null; }
  function sanitizeSq(raw){ var r=U.objOr(raw); return {
    ideo:intMap(r.ideo), rel:intMap(r.rel), ev:flagMap(r.ev), flags:flagMap(r.flags),
    quests:questMap(r.quests), seen:flagMap(r.seen),
    ending:(typeof r.ending==="string"?r.ending:null), resume:resumeVal(r.resume),
    chapter:(typeof r.chapter==="string"?r.chapter:""), ver:U.intOr(r.ver,1,1,1e6),
    char:charVal(r.char)
  };}

  function sanitizeAdventure(raw){
    var d = defaultAdventure(), r = U.objOr(raw);
    var m = U.objOr(r.msq), it = U.objOr(r.intro), mk = U.objOr(r.mock);
    return {
      msq:{ ch:U.intOr(m.ch,0,0,99), step:U.intOr(m.step,0,0,9),
            tgt:(typeof m.tgt==="string"?m.tgt:null), done:m.done?1:0 },
      cases: U.objOr(r.cases),
      intro:{ easy:it.easy?1:0, met:it.met?1:0, win:U.intOr(it.win,0,0,99999), best:U.intOr(it.best,0,0,99) },
      badges: U.objOr(r.badges),
      midboss: U.objOr(r.midboss),
      loop:    U.intOr(r.loop, 1, 1, 1e6),
      clears:  U.intOr(r.clears, 0, 0, 1e6),
      cleared: U.boolOr(r.cleared, false),
      trueWin: U.intOr(r.trueWin, 0, 0, 1e6),
      survBest:U.intOr(r.survBest, 0, 0, 1e6),
      maxCombo:U.intOr(r.maxCombo, 0, 0, 1e6),
      goldSeen:U.intOr(r.goldSeen, 0, 0, 1),
      dropPity:U.intOr(r.dropPity, 0, 0, 1e6),
      mock:{ runs:U.intOr(mk.runs,0,0,1e6), best:U.intOr(mk.best,0,0,1e6), clears:U.intOr(mk.clears,0,0,1e6) },
      nendo: U.objOr(r.nendo),
      sq: sanitizeSq(r.sq)
    };
  }

  var sel = {
    cleared:  function(s){ return s.adventure.cleared; },
    bossCount:function(s){ return Object.keys(s.adventure.badges).length; }
  };
  var act = {
    markBoss: function(s, key){ s.adventure.badges[String(key)] = 1; }
  };

  SR.slices.adventure = { def:defaultAdventure, san:sanitizeAdventure, sel:sel, act:act };
  SR.defaultAdventure = defaultAdventure; SR.sanitizeAdventure = sanitizeAdventure;
})();
