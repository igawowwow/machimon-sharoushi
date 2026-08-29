"use strict";
/* ============================================================
   learning/mastery.js — 習得判定の【単一定義】(純)
   現行は3系統に割れていた: (a) box>=3&&!ng&&c>0 = isMastered(engine.js:297)
   (b) s>=2 ストリーク = masteryPct(engine.js:312, ボス解放ゲート/演出用)
   (c) train の (qstat.s||0)<2。→ これを (a) の retrieval ベース単一定義へ統一する。
   ボス解放ゲートも進捗表示も、以後は同じ isMastered / masteryPct を参照する。
   DOM/Store非依存: env アクセサ({study,statOf,subjects,...})経由。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var L = G.SRLearning = G.SRLearning || {};

  /* 唯一の習得定義: 別日に複数回正解(box>=3)かつ直近が正解(未誤答=!ng)かつ正解歴あり。 */
  function isMastered(st){ return !!st && (st.box||0)>=3 && !st.ng && (st.c||0)>0; }

  /* env: { study:[q...](=Q), statOf:function(id)->st|undefined,
            subjects:[...], clears?:number, trueWin?:number, cleared?:boolean } */
  function statOf(env, id){ return env.statOf ? env.statOf(id) : undefined; }

  function masteredCount(env){
    var n=0, s=env.study;
    for(var i=0;i<s.length;i++){ if(isMastered(statOf(env, s[i].id))) n++; }
    return n;
  }
  function masteryPct(env, si){
    var qs=[], s=env.study;
    for(var i=0;i<s.length;i++){ if(s[i].s===si) qs.push(s[i]); }
    if(!qs.length) return 0;
    var m=0; for(var j=0;j<qs.length;j++){ if(isMastered(statOf(env, qs[j].id))) m++; }
    return m/qs.length; /* 0..1(単一定義=isMastered ベース) */
  }
  /* 科目戦力(engine.js:340-345 と同一式・ただし isMastered は単一定義に統一) */
  function subjectPower(env, si){
    var qs=[], s=env.study;
    for(var i=0;i<s.length;i++){ if(s[i].s===si) qs.push(s[i]); }
    if(!qs.length) return 0;
    var m=0, box=0;
    for(var j=0;j<qs.length;j++){
      var st=statOf(env, qs[j].id);
      if(st){ if(isMastered(st)) m++; box+=Math.min(st.box||0,5); }
    }
    return Math.round((m/qs.length*60 + box/(qs.length*5)*40));
  }
  /* 合格見込み指標(engine.js:346-352 と同一式)。名称に「合格率」は使わない=passPct=学習到達度指標。 */
  function passPct(env){
    var s=env.study, total=s.length||1;
    var m = masteredCount(env)/total*50;
    var box=0; for(var i=0;i<s.length;i++){ var st=statOf(env, s[i].id); if(st) box+=Math.min(st.box||0,5); }
    var srs = box/(total*5)*30;
    var l = Math.min(env.clears||0, 3)/3*20;
    return Math.round(m+srs+l);
  }
  function weakestSubjects(env, n){
    n = n||2;
    var arr=[];
    for(var i=0;i<env.subjects.length;i++){ arr.push({ i:i, p:subjectPower(env, i) }); }
    arr.sort(function(a,b){ return a.p-b.p; });
    return arr.slice(0, n).map(function(x){ return x.i; });
  }
  function rankTitle(env){
    var p=passPct(env);
    if(env.trueWin) return "🏆厚生労働神を超えし者";
    if(env.cleared) return "🏆合格圏マスター";
    if(p>=80) return "合格圏目前";
    if(p>=50) return "実力者";
    if(p>=20) return "受験生";
    return "見習い";
  }

  L.mastery = {
    isMastered:isMastered, masteredCount:masteredCount, masteryPct:masteryPct,
    subjectPower:subjectPower, passPct:passPct, weakestSubjects:weakestSubjects, rankTitle:rankTitle
  };
})();
