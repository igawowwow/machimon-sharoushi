"use strict";
/* state/slices/player.js — 通貨・素材・育成レベル・ログイン
   旧ST: coins,tickets,ssrT,potions,mat / xp,lv,reb / lastDay,days,loginTotal,tsLast */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SR = G.SRState = G.SRState || {}; SR.slices = SR.slices || {};
  var U = SR.util;

  function defaultPlayer(){ return {
    coins:0, tickets:0, ssrT:0, potions:0, mat:0,
    xp:0, lv:1, reb:0,
    login:{ lastDay:"", days:0, total:0, tsLast:0 }
  };}

  function sanitizePlayer(raw){
    var d = defaultPlayer(), r = U.objOr(raw), lg = U.objOr(r.login);
    return {
      coins:   U.intOr(r.coins,   d.coins,   0, 1e12),
      tickets: U.intOr(r.tickets, d.tickets, 0, 1e6),
      ssrT:    U.intOr(r.ssrT,    d.ssrT,    0, 1e6),
      potions: U.intOr(r.potions, d.potions, 0, 999),
      mat:     U.intOr(r.mat,     d.mat,     0, 1e9),
      xp:      U.intOr(r.xp,      d.xp,      0, 1e12),
      lv:      U.intOr(r.lv,      d.lv,      1, 999),
      reb:     U.intOr(r.reb,     d.reb,     0, 99),
      login:{
        lastDay: U.strOr(lg.lastDay, ""),
        days:    U.intOr(lg.days,  0, 0, 1e6),
        total:   U.intOr(lg.total, 0, 0, 1e9),
        tsLast:  Math.min(U.intOr(lg.tsLast, 0, 0, Date.now()+864e5), Date.now()) // 時計巻き戻し耐性
      }
    };
  }

  var sel = {
    coins:  function(s){ return s.player.coins; },
    level:  function(s){ return s.player.lv; },
    streak: function(s){ return s.player.login.days; }
  };
  var act = {
    addCoins: function(s,n){ s.player.coins = U.intOr(s.player.coins + n, 0, 0, 1e12); },
    addXp:    function(s,n){ s.player.xp    = U.intOr(s.player.xp    + n, 0, 0, 1e12); }
  };

  SR.slices.player = { def:defaultPlayer, san:sanitizePlayer, sel:sel, act:act };
  SR.defaultPlayer = defaultPlayer; SR.sanitizePlayer = sanitizePlayer;
})();
