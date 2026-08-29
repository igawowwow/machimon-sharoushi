"use strict";
/* state/slices/office.js — 事務所・放置収益
   旧ST: office{lv,fac,claim,trust} */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SR = G.SRState = G.SRState || {}; SR.slices = SR.slices || {};
  var U = SR.util;

  function defaultOffice(){ return {
    lv:0, fac:{}, claim:0, trust:{}
  };}

  function sanitizeOffice(raw, ctx){
    var r = U.objOr(raw);
    var today = (ctx && Number.isFinite(ctx.today)) ? ctx.today : Math.floor(Date.now()/864e5);
    var fac = U.objOr(r.fac), fout={};
    for(var f in fac){ fout[f] = U.intOr(fac[f], 0, 0, 99); }
    var trust = U.objOr(r.trust), tout={};
    for(var c in trust){ tout[c] = U.intOr(trust[c], 0, 0, 1e9); }
    /* claim: 0/未定義/未来 は「今日」に補正 = 旧セーブでも初回に過剰な放置収益を出さない */
    var claim = U.intOr(r.claim, 0, 0, 1e9);
    if(claim <= 0 || claim > today) claim = today;
    return {
      lv:    U.intOr(r.lv, 0, 0, 99),
      fac:   fout,
      claim: claim,
      trust: tout
    };
  }

  var sel = {
    rank:  function(s){ return s.office.lv; },
    trustOf: function(s, cp){ return s.office.trust[cp] || 0; }
  };
  var act = {
    addTrust: function(s, cp, n){ s.office.trust[cp] = U.intOr((s.office.trust[cp]||0) + n, 0, 0, 1e9); }
  };

  SR.slices.office = { def:defaultOffice, san:sanitizeOffice, sel:sel, act:act };
  SR.defaultOffice = defaultOffice; SR.sanitizeOffice = sanitizeOffice;
})();
