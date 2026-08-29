"use strict";
/* state/slices/collection.js — 装備/ガチャ/図鑑/仲間/実績/既読
   旧ST: inv,eq,enh,toppa / gPity,gTotal(→gacha) / bestiary,eSeen,eKill / zk(→law) / party,ach,story */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SR = G.SRState = G.SRState || {}; SR.slices = SR.slices || {};
  var U = SR.util;

  function defaultCollection(){ return {
    inv:{ t1:1 },
    eq:{ w:"w0", a:null, c:null, t:"t1" },
    enh:{}, toppa:{},
    gacha:{ pity:0, total:0 },
    bestiary:{}, eSeen:{}, eKill:{},
    law:{},
    party:{}, ach:{}, story:{}
  };}

  function sanitizeIntMap(raw, min, max){
    var r = U.objOr(raw), out={};
    for(var k in r){ out[k] = U.intOr(r[k], 0, (min===undefined?0:min), (max===undefined?1e9:max)); }
    return out;
  }

  function sanitizeCollection(raw){
    var d = defaultCollection(), r = U.objOr(raw);
    var eq = U.objOr(r.eq), gc = U.objOr(r.gacha);
    return {
      inv: sanitizeIntMap(r.inv, 0, 1e6),
      eq:{ w:U.strOr(eq.w,"w0"),
           a:(typeof eq.a==="string"?eq.a:null),
           c:(typeof eq.c==="string"?eq.c:null),
           t:U.strOr(eq.t,"t1") },
      enh:   sanitizeIntMap(r.enh, 0, 999),
      toppa: sanitizeIntMap(r.toppa, 0, 999),
      gacha:{ pity:U.intOr(gc.pity,0,0,1e6), total:U.intOr(gc.total,0,0,1e9) },
      bestiary: U.objOr(r.bestiary),
      eSeen: U.objOr(r.eSeen),
      eKill: U.objOr(r.eKill),
      law:   U.objOr(r.law),
      party: U.objOr(r.party),
      ach:   U.objOr(r.ach),
      story: U.objOr(r.story)
    };
  }

  var sel = {
    owns:      function(s, id){ return (s.collection.inv[id]||0) > 0; },
    achCount:  function(s){ return Object.keys(s.collection.ach).length; }
  };
  var act = {
    addItem:   function(s, id, n){ s.collection.inv[id] = U.intOr((s.collection.inv[id]||0) + (n||1), 0, 0, 1e6); },
    unlockAch: function(s, id){ s.collection.ach[String(id)] = 1; }
  };

  SR.slices.collection = { def:defaultCollection, san:sanitizeCollection, sel:sel, act:act };
  SR.defaultCollection = defaultCollection; SR.sanitizeCollection = sanitizeCollection;
})();
