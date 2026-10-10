"use strict";
/* ============================================================
   machimon/core/exam.js — 本試験形式の問題(五肢択一・個数・年度別・選択式)と 実力メーター
   ★本試験形式の問題は ふだんの問題の表(Q)とは別にある(QBY)。けいこの4問に1問・取組のあと2本に出す。
   ★実力メーター: ○×の習熟 と 本試験形式の正答 を科目ごとに合わせた目安(きろく の画面)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  var EXAM=null;
  function ids(){
    if(EXAM)return EXAM; EXAM=[];
    try{ if(G.QBY)G.QBY.forEach(function(q){ if(q&&(q.examFmt||q.nendo||q.sentaku)&&(q.choices||q.passage))EXAM.push(q.id); }); }catch(e){}
    return EXAM;
  }
  function isExam(q){ return !!(q&&(q.examFmt||q.nendo||q.sentaku)); }
  /* n問えらぶ(いま解くべき順の上位から。sub を渡すとその科目だけ) */
  function pick(c,n,sub){
    var L=ids(), m=MM.learn.masteryBySub(c), cand=[];
    for(var i=0;i<L.length;i++){ var q=G.qById(L[i]); if(!q)continue; if(typeof sub==="number"&&q.s!==sub)continue; cand.push({id:q.id,p:MM.learn.priority(q,c,{mastery:m})}); }
    cand.sort(function(a,b){ return b.p-a.p; });
    var top=cand.slice(0,Math.max(12,n*3)), out=[];
    while(out.length<n&&top.length){ var k=Math.floor(c.rand()*Math.min(top.length,8)); out.push(top.splice(k,1)[0].id); }
    return out;
  }
  /* 実力メーター: 科目ごとに 0〜100。70 を目標の線にする */
  function meter(c){
    var mast=MM.learn.masteryBySub(c), ex={}, L=ids();
    for(var i=0;i<L.length;i++){ var q=G.qById(L[i]); if(!q)continue; var st=(c.ST.q&&c.ST.q[q.id])||{}; var e=ex[q.s]||(ex[q.s]={c:0,n:0,tot:0}); e.tot++; if((st.c||0)+(st.w||0)>0){ e.n++; if(st.box>=2||(st.c||0)>(st.w||0))e.c++; } }
    var subs=[], sum=0;
    for(var s2=0;s2<9;s2++){ var mm2=mast[s2]||0, e2=ex[s2]||{c:0,n:0,tot:0}, ea=e2.tot?e2.c/e2.tot:0;
      var v=Math.round((e2.tot?(0.6*mm2+0.4*ea):mm2)*100); subs.push({sub:s2,v:v}); sum+=v; }
    var low=subs.reduce(function(a,x){ return x.v<a.v?x:a; },subs[0]);
    return { subs:subs, avg:Math.round(sum/9), low:low, line:70 };
  }
  MM.exam={ ids:ids, isExam:isExam, pick:pick, meter:meter };
})();
