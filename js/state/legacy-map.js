"use strict";
/* ============================================================
   state/legacy-map.js — 新 slice ⇔ 旧フラットST の対応表(1箇所集約)
   互換シム(legacy-shim.js)が旧UIへ ST 形を見せるための唯一の翻訳層。
   ここだけが「どの slice キーが どの ST キーに対応するか」を知る。
   往復不変(state→legacy→state / legacy→state→legacy)を smoke-store.js が検証。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SR = G.SRState = G.SRState || {};
  var SCHEMA = SR.SCHEMA || 4;

  function o(v){ return (v && typeof v==="object" && !Array.isArray(v)) ? v : {}; }

  /* ---- slice state → 旧フラット ST(旧 ui-*.js が読む形) ---- */
  function stateToLegacy(state){
    var s = o(state);
    var P = o(s.player),  L = o(s.learning), A = o(s.adventure),
        C = o(s.collection), O = o(s.office), S = o(s.settings);
    var lg = o(P.login), kl = o(L.kills), dl = o(L.daily), wk = o(L.weekly),
        pw = o(L.pow), gc = o(C.gacha);
    return {
      v: SCHEMA,
      /* player */
      coins:P.coins, tickets:P.tickets, ssrT:P.ssrT, potions:P.potions, mat:P.mat,
      xp:P.xp, lv:P.lv, reb:P.reb,
      lastDay:lg.lastDay, days:lg.days, loginTotal:lg.total, tsLast:lg.tsLast,
      /* learning */
      q:L.q, totalC:L.totalC, totalW:L.totalW,
      mobKills:kl.mob, metalKills:kl.metal, midKills:kl.mid,
      cnt:L.cnt, hist:L.hist,
      dq:{ d:dl.d, cor:dl.cor, ans:dl.ans, cl:dl.cleared },
      wq:{ wk:wk.wk, a:wk.ans, c:wk.cor, d:wk.days, ld:wk.lastDay, cl:wk.cleared },
      pow:{ d:pw.d, p:pw.power, m:pw.mastery },
      /* adventure */
      msq:A.msq, cases:A.cases, intro:A.intro, mock:A.mock, nendo:A.nendo, midboss:A.midboss,
      loop:A.loop, clears:A.clears, cleared:A.cleared, trueWin:A.trueWin,
      survBest:A.survBest, maxCombo:A.maxCombo, goldSeen:A.goldSeen, dropPity:A.dropPity,
      badges:A.badges, sq:A.sq,
      /* collection */
      inv:C.inv, eq:C.eq, enh:C.enh, toppa:C.toppa,
      gPity:gc.pity, gTotal:gc.total,
      bestiary:C.bestiary, eSeen:C.eSeen, eKill:C.eKill,
      zk:C.law, party:C.party, ach:C.ach, story:C.story,
      /* office */
      office:{ lv:O.lv, fac:O.fac, claim:O.claim, trust:O.trust },
      /* settings → opt */
      opt:{ mute:!S.seOn, beginner:S.beginner, bgm:S.bgmOn, big:S.big, skk:S.skk,
            bgmVol:S.bgmVol, seVol:S.seVol, focus:S.focus, lowData:S.lowData, course:S.course,
            bgmTouched:S.bgmTouched, reduceMotion:S.reduceMotion, theme:S.theme,
            /* 新UI専用フラグ(旧UIは無視)。ST 越しに opt.dev で不可逆消失させず往復維持 */
            dev:S.dev }
    };
  }

  /* ---- 旧フラット ST → slice state(書込委譲/初期化変換の逆写像) ---- */
  function legacyToState(flat){
    var f = o(flat);
    var lg = { lastDay:f.lastDay, days:f.days, total:f.loginTotal, tsLast:f.tsLast };
    var dq = o(f.dq), wq = o(f.wq), pw = o(f.pow), off = o(f.office), opt = o(f.opt);
    return {
      player:{
        coins:f.coins, tickets:f.tickets, ssrT:f.ssrT, potions:f.potions, mat:f.mat,
        xp:f.xp, lv:f.lv, reb:f.reb, login:lg
      },
      learning:{
        q:f.q, totalC:f.totalC, totalW:f.totalW,
        kills:{ mob:f.mobKills, metal:f.metalKills, mid:f.midKills },
        cnt:f.cnt, hist:f.hist,
        daily:{ d:dq.d, ans:dq.ans, cor:dq.cor, cleared:dq.cl },
        weekly:{ wk:wq.wk, ans:wq.a, cor:wq.c, days:wq.d, lastDay:wq.ld, cleared:wq.cl },
        pow:{ d:pw.d, power:pw.p, mastery:pw.m }
      },
      adventure:{
        msq:f.msq, cases:f.cases, intro:f.intro, mock:f.mock, nendo:f.nendo, midboss:f.midboss,
        loop:f.loop, clears:f.clears, cleared:f.cleared, trueWin:f.trueWin,
        survBest:f.survBest, maxCombo:f.maxCombo, goldSeen:f.goldSeen, dropPity:f.dropPity,
        badges:f.badges, sq:o(f.sq)
      },
      collection:{
        inv:f.inv, eq:f.eq, enh:f.enh, toppa:f.toppa,
        gacha:{ pity:f.gPity, total:f.gTotal },
        bestiary:f.bestiary, eSeen:f.eSeen, eKill:f.eKill,
        law:f.zk, party:f.party, ach:f.ach, story:f.story
      },
      office:{ lv:off.lv, fac:off.fac, claim:off.claim, trust:off.trust },
      settings:{
        beginner:opt.beginner, course:opt.course,
        seOn:!opt.mute, bgmOn:opt.bgm, bgmVol:opt.bgmVol, seVol:opt.seVol,
        focus:opt.focus, lowData:opt.lowData, bgmTouched:opt.bgmTouched,
        big:opt.big, skk:opt.skk, reduceMotion:opt.reduceMotion, theme:opt.theme,
        dev:(opt.dev!=null ? opt.dev : { newUI:{} })
      }
    };
  }

  SR.legacyMap = { stateToLegacy:stateToLegacy, legacyToState:legacyToState };
  G.SRLegacyMap = SR.legacyMap;
})();
