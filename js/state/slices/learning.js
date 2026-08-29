"use strict";
/* state/slices/learning.js — 問題別学習履歴(唯一の集約先)+ 成績カウンタ
   最重要スライス。旧ST の q + hist,dq,wq,cnt,totalC,totalW,mobKills,metalKills,midKills,pow を集約。
   q[id] の中身キー(c/w/ng/s/bm/box/due/la/ease/mr/sa/sac)は【凍結】= SRS/苦手/習得を1バイトも壊さない。 */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SR = G.SRState = G.SRState || {}; SR.slices = SR.slices || {};
  var U = SR.util;

  /* 1問の学習記録。フィールド名は現 ST.q[id] を完全踏襲(凍結) */
  function defaultQStat(){ return {
    c:0, w:0, ng:false, s:0, bm:false,
    box:0, due:0, la:0, ease:2.3, mr:{}, sa:-1, sac:0
  };}
  function sanitizeQStat(raw){
    var o = U.objOr(raw);
    return {
      c:  U.intOr(o.c, 0, 0, 1e6),
      w:  U.intOr(o.w, 0, 0, 1e6),
      ng: U.boolOr(o.ng, false),
      s:  U.intOr(o.s, 0, 0, 1e4),
      bm: U.boolOr(o.bm, false),
      box:U.intOr(o.box, 0, 0, 5),
      due:U.intOr(o.due, 0, 0, 1e7),
      la: U.intOr(o.la, 0, 0, 1e7),
      ease:U.numOr(o.ease, 2.3, 1.3, 3.0),
      mr: U.objOr(o.mr),
      sa: U.intOr(o.sa, -1, -1, 2),
      sac:U.intOr(o.sac, 0, 0, 1e6)
    };
  }

  function defaultLearning(){ return {
    q:{},                             // { [questionId:String]: QStat } ← 学習履歴の単一の真実
    totalC:0, totalW:0,               // 累計 正解/誤答
    kills:{ mob:0, metal:0, mid:0 },  // 学習量の代理(旧 mobKills/metalKills/midKills)
    cnt:{ crit:0, rev:0, chest:0, pull:0, sp:0 }, // 会心/復習/宝箱/ガチャ/必殺
    hist:{},                          // 日別プレイ履歴 { [day]:{a,c} }。90日で切詰
    daily:{ d:"", ans:0, cor:0, cleared:[false,false,false,false] },  // 旧 dq
    weekly:{ wk:0, ans:0, cor:0, days:0, lastDay:"", cleared:[false,false,false] }, // 旧 wq
    pow:{ d:"", power:0, mastery:0 }  // 「今日の成長」基準スナップ
  };}

  function sanitizeHist(raw, today){
    var r = U.objOr(raw), out={};
    var days = Object.keys(r).filter(function(k){
      var n = Number(k);
      return Number.isFinite(n) && (today==null || n <= today);
    });
    days.sort(function(a,b){ return Number(b) - Number(a); });
    days = days.slice(0, 90);
    days.forEach(function(k){
      var e = U.objOr(r[k]);
      out[k] = { a:U.intOr(e.a, 0, 0, 1e7), c:U.intOr(e.c, 0, 0, 1e7) };
    });
    return out;
  }

  function sanitizeLearning(raw, ctx){
    var r = U.objOr(raw);
    /* ガード: 問題バンク未ロード(Q空)なら q を触らず温存(現 engine.js:197 の破損保護を移設) */
    var rawQ = U.objOr(r.q), q;
    if(ctx && ctx.bankReady===false){
      q = rawQ;                       // 未構築時は GC しない(混在ロードでの履歴消失防止)
    } else {
      q = {};
      for(var id in rawQ){
        if(ctx && ctx.qResolvable && !ctx.qResolvable(id)) continue; // 解決不能ID=旧残骸を捨てる
        q[String(id)] = sanitizeQStat(rawQ[id]);
      }
    }
    var kl = U.objOr(r.kills), cnt = U.objOr(r.cnt),
        dl = U.objOr(r.daily), wk = U.objOr(r.weekly), pw = U.objOr(r.pow);
    return {
      q: q,
      totalC: U.intOr(r.totalC, 0, 0, 1e9),
      totalW: U.intOr(r.totalW, 0, 0, 1e9),
      kills:{ mob:U.intOr(kl.mob,0,0,1e9), metal:U.intOr(kl.metal,0,0,1e9), mid:U.intOr(kl.mid,0,0,1e9) },
      cnt:{ crit:U.intOr(cnt.crit,0,0,1e9), rev:U.intOr(cnt.rev,0,0,1e9), chest:U.intOr(cnt.chest,0,0,1e9),
            pull:U.intOr(cnt.pull,0,0,1e9), sp:U.intOr(cnt.sp,0,0,1e9) },
      hist: sanitizeHist(r.hist, ctx && ctx.today),
      daily:{ d:U.strOr(dl.d,""), ans:U.intOr(dl.ans,0,0,1e6), cor:U.intOr(dl.cor,0,0,1e6),
              cleared:U.fixBoolArr(dl.cleared,4) },
      weekly:{ wk:U.intOr(wk.wk,0,0,1e9), ans:U.intOr(wk.ans,0,0,1e6), cor:U.intOr(wk.cor,0,0,1e6),
               days:U.intOr(wk.days,0,0,7), lastDay:U.strOr(wk.lastDay,""), cleared:U.fixBoolArr(wk.cleared,3) },
      pow:{ d:U.strOr(pw.d,""), power:U.intOr(pw.power,0,0,1e9), mastery:U.intOr(pw.mastery,0,0,100) }
    };
  }

  /* セレクタ(純・DOM非依存)。冒険/試練が同じAPIを呼ぶ土台 */
  var sel = {
    dueIds:   function(s, today){ var o=[],q=s.learning.q; for(var id in q){ if(q[id].box>0 && q[id].due<=today) o.push(id); } return o; },
    wrongIds: function(s){ var o=[],q=s.learning.q; for(var id in q){ if(q[id].ng) o.push(id); } return o; },
    bmIds:    function(s){ var o=[],q=s.learning.q; for(var id in q){ if(q[id].bm) o.push(id); } return o; },
    seenCount:function(s){ return Object.keys(s.learning.q).length; }
  };
  var act = {
    ensureQ: function(s, id){ id=String(id); if(!s.learning.q[id]) s.learning.q[id]=defaultQStat(); return s.learning.q[id]; },
    recordTotals: function(s, ok){ if(ok) s.learning.totalC++; else s.learning.totalW++; }
  };

  SR.slices.learning = { def:defaultLearning, san:sanitizeLearning, sel:sel, act:act };
  SR.defaultLearning = defaultLearning; SR.sanitizeLearning = sanitizeLearning;
  SR.defaultQStat = defaultQStat; SR.sanitizeQStat = sanitizeQStat;
})();
