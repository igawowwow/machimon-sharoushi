"use strict";
/* ============================================================
   learning/scoring.js — 採点の芯(純関数)。ui-battle.js resolve()(356-540)の
   「学習部分だけ」を DOM/報酬/演出から引き剥がした。
   scoreAnswer(qid,userAns,ctx) → 学習事実のみ返す。q[id] の更新(c/w/ng/s/box/due/ease/la)は
   ctx.stat を破壊的に反映(scheduler 経由)。報酬額/演出/DOM は呼び出し側(screens/battle)の責務。
   ・答えを自動で当てない(判定は q.a / userAns.ok の照合のみ)。
   ・SRS更新は scheduler に委譲(固定日数化しない・parityで旧resolveと数値一致)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var L = G.SRLearning = G.SRLearning || {};

  /* 出題形式の純判定(ui-quiz.js quizFormat から case専用の tap_error 分岐を除いた study 版)。
     通常セッション(kind===study)は tap_error を含まないため、G 参照なしで旧と一致。 */
  function quizFormat(q){
    if(!q) return "true_false";
    if(q.format==="choice") return "choice";
    if(q.format==="fill_blank") return "fill_blank";
    if(q.format==="reorder") return "reorder";
    return "true_false";
  }

  /* 正解の「質」で攻撃を差別化する純判定(ui-quiz.js attackKind と同一ロジック・UI非依存)。
     速度(会心)は種別に関与させない=法律は熟読が本質。 */
  var ATK = {
    normal:  {key:"normal",  name:"通常攻撃", word:"着実に一撃を入れた",         fx:1, cls:"",     mult:1},
    precise: {key:"precise", name:"精密攻撃", word:"誤り箇所を正確に見抜いた",   fx:2, cls:"crit", mult:1.1},
    weak:    {key:"weak",    name:"弱点攻撃", word:"かつての苦手を克服した",     fx:2, cls:"crit", mult:1.15},
    memory:  {key:"memory",  name:"記憶会心", word:"忘却を乗り越えた記憶の一撃", fx:3, cls:"crit", mult:1.2},
    ultimate:{key:"ultimate",name:"奥義",     word:"理解しきった奥義が炸裂",     fx:3, cls:"crit", mult:1.25}
  };
  function attackKind(q, ctx){
    ctx = ctx || {};
    if(ctx.checkPassed) return "ultimate";
    if(ctx.wasDue && !ctx.repeat) return "memory";
    if(ctx.hadWrong) return "weak";
    if(ctx.format==="tap_error") return "precise";
    return "normal";
  }

  /* 採点の純関数。
     ctx = { q:<question>, stat:<qstat(破壊的更新対象)>, today:<todayNum>, checkPassed?:bool }
     戻り値 = { ok, timeout, wasDue, wasSeen, repeat, memMult, hadWrong, attackKind,
                deltas:{ totalC, totalW, rev } }
     deltas は呼び出し側が learning カウンタへ反映する(純化のため副作用にしない)。 */
  function scoreAnswer(qid, userAns, ctx){
    ctx = ctx || {};
    var sched = L.scheduler;
    var st = ctx.stat;
    var q  = ctx.q;
    var today = (ctx.today!=null) ? ctx.today : Math.floor(Date.now()/864e5);
    var checkPassed = !!ctx.checkPassed;

    var timeout = (userAns===null);
    var ext = (userAns!==null && typeof userAns==="object"); /* choice/tap_error の {ok,label} */
    var ok = !timeout && (ext ? !!userAns.ok : userAns===q.a);
    /* repeat: 今日すでに解いた問題(同日連打は習得扱いにしない現行を尊重)。ミューテーション前に判定 */
    var repeat = (st.la===today) && ((st.c||0)+(st.w||0))>0;

    if(ok){
      var wasSeen = ((st.c||0)+(st.w||0))>0;
      var hadWrong = ((st.w||0)>0) || !!st.ng;         /* st.ng 更新前に判定 */
      var memMult = sched.memBonusMult(st, wasSeen, today); /* la 更新前に判定 */
      st.c = (st.c||0)+1; st.ng = false;
      if(!repeat) st.s = (st.s||0)+1;                  /* 同日連打では習得ストリークは進まない */
      var wasDue = sched.srsOnCorrect(st, wasSeen, today);
      var ak = attackKind(q, { wasDue:wasDue, repeat:repeat, hadWrong:hadWrong, format:quizFormat(q), checkPassed:checkPassed });
      return { ok:true, timeout:false, wasDue:wasDue, wasSeen:wasSeen, repeat:repeat,
               memMult:memMult, hadWrong:hadWrong, attackKind:ak,
               deltas:{ totalC:1, totalW:0, rev: wasDue?1:0 } };
    } else {
      var wasSeen2 = ((st.c||0)+(st.w||0))>0;
      st.w = (st.w||0)+1; st.ng = true; st.s = 0;
      sched.srsOnWrong(st, today);
      return { ok:false, timeout:timeout, wasDue:false, wasSeen:wasSeen2, repeat:repeat,
               memMult:1, hadWrong:false, attackKind:null,
               deltas:{ totalC:0, totalW:1, rev:0 } };
    }
  }

  L.scoring = { scoreAnswer:scoreAnswer, attackKind:attackKind, quizFormat:quizFormat, ATK:ATK };
})();
