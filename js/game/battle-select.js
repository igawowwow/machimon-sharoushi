"use strict";
/* ============================================================
   game/battle-select.js — S4(A)(B)(D) 旧UIバトルの「出題の選び方」と入口の作戦カード
   ui-battle.js から選抜まわりだけを切り出した薄い層。描画も採点もここではやらない。
   ・trainCourseIds: 修行の出題を「科目の全プール×直近ID回避×難易度ランプ」で組む
   ・bossCourseIds : ボス戦を本試験形式(examFmt)中心に組む(過去問と同難易度)
   ・battleStratHtml: コース入口に出す作戦カード(SRLearning.strategy へ委譲)
   純ロジック層(SRLearning.selection/strategy)が無い環境では従来挙動へ安全に退く。
   【不変】問題データ・問題ID・採点・SRS・報酬には一切触れない(選び方と並びだけ)。
   eval/new Function 不使用。
   ============================================================ */
/* S4(B): ボス戦は本試験形式(examFmt=五肢択一/個数)中心=過去問と同難易度。
   HP制でプールを周回するので、examFmt を先頭側に厚く積んだうえで残りを○×で繋ぐ。
   問題データ・ID・採点・SRS・報酬は不変(選び方と並びだけ)。 */
function bossCourseIds(i){
  const all=bossIdsBase(i);
  const SEL=(typeof SRLearning!=="undefined")&&SRLearning.selection;
  if(!SEL)return all;
  const n=Math.max(6,bossHPMax(i));
  const exam=(typeof subjectExamQs==="function")?subjectExamQs(i):[];
  if(!exam.length)return all; /* その科目に本試験形式が無ければ従来どおり */
  const ring=(typeof recentQRing==="function")?recentQRing():[];
  const picked=SEL.buildSet({tfPool:Q.filter(x=>x.s===i),examPool:exam,ring,n,
    exam:SEL.examQuota(n,3,"boss")});
  if(picked.length<3)return all;
  const ids=picked.map(q=>q.id),have={};ids.forEach(id=>have[id]=1);
  return ids.concat(all.filter(id=>!have[id]));
}
/* S4(A)(B): 修行の出題を「科目の全プールから毎回ランダム抽出+直近ID回避+難易度ランプ」で組む。
   ・同じ問題ばかり出る/範囲が狭い、を選び方だけで解消(問題データ・ID・採点・SRSは不変)。
   ・stage(その科目の解答累計)に応じて本試験形式(examFmt)を段階的に混ぜる=ヌルゲー化を防ぐ。
   ・選抜層(SRLearning.selection)が無い環境は従来の並べ方へ安全に退く。 */
function trainCourseIds(i){
  const legacy=()=>trainIdsBase(i); /* 既定の並べ方は ui-battle.js 側の単一の真実を使う */
  const SEL=(typeof SRLearning!=="undefined")&&SRLearning.selection;
  if(!SEL)return legacy();
  /* メタル/中ボスで手数が伸びるぶん、1コース分の倍を用意しておく(尽きたら legacy で継ぎ足し) */
  const n=courseCapN()*2;
  const stage=SEL.stageOf((typeof subjectSeenCount==="function")?subjectSeenCount(i):0);
  const quota=SEL.examQuota(n,stage,"mob");
  const exam=(typeof subjectExamQs==="function")?subjectExamQs(i):[];
  const ring=(typeof recentQRing==="function")?recentQRing():[];
  const picked=SEL.buildSet({tfPool:Q.filter(x=>x.s===i),examPool:exam,ring,n,exam:quota});
  if(picked.length<3)return legacy();
  const ids=picked.map(q=>q.id),have={};ids.forEach(id=>have[id]=1);
  return ids.concat(legacy().filter(id=>!have[id])); /* 尽きても止まらないよう残りを後ろに繋ぐ */
}
/* S4(D): この戦闘の「戦略目安」。コース入口(1問目)にだけ出し、以降はテンポを止めない。
   出題数・本試験形式の混入数は"実際に選ばれた問題"から数えるので表示と中身がズレない。 */
function battleStratHtml(){
  const SS=(typeof SRLearning!=="undefined")&&SRLearning.strategy;
  if(!SS||!G||!G.course||!Array.isArray(G.ids))return "";
  const cap=G.courseCap||courseCapN();
  const done=Math.min(cap,(G.mode==="train"?(G.cAns||0):(G.idx||0)));
  if(done!==0)return "";
  const exam=G.ids.slice(0,cap).filter(id=>{const q=qById(id);return !!q&&(q.examFmt===true||(q.format&&q.format!=="true_false"));}).length;
  const theme=G.stratTheme||(G.mode==="train"
    ?((typeof SUBJECTS!=="undefined"&&SUBJECTS[G.boss])?SUBJECTS[G.boss]:"この科目の論点")
    :((typeof courseAreaName==="function")?courseAreaName(G.mode,G.boss):"この科目の論点"));
  return SS.html(SS.plan({n:cap,exam,rank:G.encRank||"mob",theme}));
}
if(typeof window!=="undefined"){
  window.trainCourseIds=trainCourseIds;window.bossCourseIds=bossCourseIds;
  window.battleStratHtml=battleStratHtml;
}
