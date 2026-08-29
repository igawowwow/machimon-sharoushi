"use strict";
/* ============================================================
   learning/pools.js — 出題プールの集約(純)。冒険/試練が同じプールAPIを呼ぶ土台。
   ・一般学習プール(kind===study)の単一ゲート isStudyQ() を持ち、examFmt/nendo/case/未監修を
     1条件で除外する(現 buildBank:68 の4連ANDと同義)。→ 本試験形式の通常混入を型で禁止。
   ・dueIds/wrongIds/bmIds/leechIds は engine.js の同名関数と同一意味(学習履歴基準)。
   DOM/Store非依存: env アクセサ経由。qstat を自動生成しない(純: 無い履歴は default 相当に扱う)。
   env = { study:[q...](=Q), all:[q...](=全QBY値・省略時 study), statOf:fn(id)->st|undefined, today:number }
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var L = G.SRLearning = G.SRLearning || {};
  var sched = L.scheduler, mastery = L.mastery;

  /* 一般学習プール判定の単一の真実(buildBank と同義)。examFmt/nendo/caseOnly/未監修は study でない。 */
  function isStudyQ(q){
    return !!q && !q.caseOnly && !q.examFmt && !q.nendo && q.reviewStatus!=="unverified";
  }
  function statOf(env, id){ return env.statOf ? env.statOf(id) : undefined; }
  function allOf(env){ return env.all || env.study; }

  /* 復習期限が来ている(履歴有り c+w>0 かつ due<=today)。engine.js:307 dueIds と同一。 */
  function dueIds(env){
    var out=[], s=env.study;
    for(var i=0;i<s.length;i++){ var st=statOf(env, s[i].id); if(sched.isDue(st, env.today)) out.push(s[i].id); }
    return out;
  }
  /* 直近誤答のまま(苦手)。engine.js:308 wrongIds と同一意味(qstat自動生成は行わない)。 */
  function wrongIds(env){
    var out=[], s=env.study;
    for(var i=0;i<s.length;i++){ var st=statOf(env, s[i].id); if(st && st.ng) out.push(s[i].id); }
    return out;
  }
  /* ブックマーク。engine.js:309 bmIds と同一。 */
  function bmIds(env){
    var out=[], s=env.study;
    for(var i=0;i<s.length;i++){ var st=statOf(env, s[i].id); if(st && st.bm) out.push(s[i].id); }
    return out;
  }
  /* 沼問題のうち未習得(救済対象)。engine.js:299 leechIds と同一。 */
  function leechIds(env){
    var out=[], s=env.study;
    for(var i=0;i<s.length;i++){
      var st=statOf(env, s[i].id);
      if(st && sched.isLeech(st) && !mastery.isMastered(st)) out.push(s[i].id);
    }
    return out;
  }
  /* 未挑戦(履歴無し or c+w===0)。 */
  function unseenIds(env){
    var out=[], s=env.study;
    for(var i=0;i<s.length;i++){ var st=statOf(env, s[i].id); if(!st || (st.c||0)+(st.w||0)===0) out.push(s[i].id); }
    return out;
  }

  /* --- 本試験系プール(通常プールには絶対に混ぜない・型で分離) --- */
  /* 五肢択一(examFmt)の全ID。一般プール study には含まれないため all から収集(engine.js:318)。 */
  function examFmtIds(env){
    var out=[], a=allOf(env);
    for(var i=0;i<a.length;i++){ if(a[i].examFmt) out.push(a[i].id); }
    return out;
  }
  /* 年度別過去問(裏面)。all から収集。 */
  function nendoIds(env){
    var out=[], a=allOf(env);
    for(var i=0;i<a.length;i++){ if(a[i].nendo) out.push(a[i].id); }
    return out;
  }
  /* ○×の本試験改題(解説に「本試験」を含む study 問題)。engine.js:316 pastQIds と同一。 */
  function pastQIds(env){
    var out=[], s=env.study;
    for(var i=0;i<s.length;i++){ if(String(s[i].e||"").indexOf("本試験")>=0) out.push(s[i].id); }
    return out;
  }
  /* 本試験系モードの拡張プール: examFmt 最優先 → 不足を pastQ で補う(engine.js:321 examPastIds)。
     決定的順序(シャッフルは呼び出し側の責務=純)。 */
  function examPastIds(env){
    var ex=examFmtIds(env), have={}, i;
    for(i=0;i<ex.length;i++) have[String(ex[i])]=1;
    var past=pastQIds(env).filter(function(id){ return !have[String(id)]; });
    return ex.concat(past);
  }

  L.pools = {
    isStudyQ:isStudyQ, dueIds:dueIds, wrongIds:wrongIds, bmIds:bmIds, leechIds:leechIds,
    unseenIds:unseenIds, examFmtIds:examFmtIds, nendoIds:nendoIds, pastQIds:pastQIds, examPastIds:examPastIds
  };
})();
