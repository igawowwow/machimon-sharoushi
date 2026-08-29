"use strict";
/* ============================================================
   core/recommend.js — 今やるべき問題の選定(理由付き)
   優先順位: ①復習期限超過 ②過去の誤答 ③弱点科目 ④未挑戦 ⑤本試験頻出
   同一科目に偏りすぎないよう科目ごとに上限を設ける。
   ============================================================ */
function recommend20(n=20){
  const ids=[],reasons={},perSub={};
  const cap=Math.max(4,Math.ceil(n/3)); /* 1科目あたりの上限 */
  const push=(id,reason)=>{
    if(ids.length>=n||reasons[id]!==undefined)return false;
    const s=qById(id).s;
    if((perSub[s]||0)>=cap)return false;
    ids.push(id);reasons[id]=reason;perSub[s]=(perSub[s]||0)+1;
    return true;
  };
  const tdn=todayNum();
  /* ① 期限超過(超過日数が大きい順) */
  const due=dueIds().map(id=>({id,over:tdn-(ST.q[id].due||0)})).sort((a,b)=>b.over-a.over);
  for(const d of due){
    if(ids.length>=Math.min(12,n))break;
    push(d.id,d.over>=2?`復習期限を${d.over}日過ぎています`:"今日が復習どきです(忘却曲線)");
  }
  /* ①.5 沼問題(誤答を重ねた要注意問題)を最優先で救済 */
  for(const id of shuffle(leechIds())){
    if(ids.length>=Math.min(14,n))break;
    push(id,"何度も間違えている要注意問題です");
  }
  /* ② 誤答したまま正解できていない問題 */
  for(const id of shuffle(wrongIds())){
    if(ids.length>=Math.min(15,n))break;
    push(id,"前回間違えた問題です");
  }
  /* ③ 弱点科目の未習得問題 */
  const weak=weakestSubjects(2);
  for(const w of weak){
    const pool=shuffle(Q.filter(x=>x.s===w&&(qstat(x.id).s||0)<2).map(x=>x.id));
    for(const id of pool){
      if(ids.length>=n-3)break;
      push(id,`${SUBJECTS[w]}が弱点です(定着度最下位)`);
    }
  }
  /* ④ 未挑戦の新問 */
  for(const id of shuffle(Q.filter(x=>{const st=ST.q[x.id];return !st||st.c+st.w===0;}).map(x=>x.id))){
    if(ids.length>=n)break;
    push(id,"まだ解いたことのない新問です");
  }
  /* ⑤ 残り: 本試験ベース問題→全体 */
  for(const id of shuffle(pastQIds())){if(ids.length>=n)break;push(id,"本試験の出題実績がある論点です");}
  for(const id of shuffle(Q.map(x=>x.id))){if(ids.length>=n)break;push(id,"総仕上げの1問です");}
  return {ids,reasons};
}
