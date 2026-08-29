"use strict";
/* ============================================================
   core/course.js — 1コースの長さ管理(M0: 1コース≒3分)
   雑魚ラッシュ系(修行/復習/おすすめ/リベンジ/ブクマ)を短いバッチに区切り、
   「戦果→続きへ」でワンタップ再開=気軽に何度も遊べるようにする純ロジック層。
   ・学習の芯(#42 SRS/retrieval/同日連打非習得)には一切触れない=出題の"量"だけ小分けにする。
   ・ボス/中ボス/試験の神/模試/悪魔/事件簿/サバイバルの長さは変えない(HP・基準点のまま)。
   ・返すのは数値/文字のみ(DOM非依存)。engine のグローバル(Q/qstat/dueIds…)は実行時参照。
   ============================================================ */
/* 1問≒12〜18秒想定。normal=12問で約3分。短め/長めも選べる(既定normal)。 */
const COURSE_PRESETS={short:9,normal:12,long:15};
function courseLen(){
  const k=(typeof ST!=="undefined"&&ST.opt&&ST.opt.course)||"normal";
  return COURSE_PRESETS[k]||COURSE_PRESETS.normal;
}
/* このスライスで小分け対象にする雑魚ラッシュ系モード名(参照用)。
   実際の分岐は G.course フラグで行う(論点特訓/クセ退治ドリルは mode:"reco" だが対象外のため)。 */
function isCourseMode(m){return m==="train"||m==="review"||m==="reco"||m==="rev"||m==="bm";}
/* 各モードで「まだ残っている問題数」= 次コースに引き継がれる母数。
   これが『あと◯コース/◯問』表示と“続きへ”の出し分けに使われる。 */
function coursePoolLeft(mode,boss){
  try{
    if(mode==="train"){
      /* 未習得 かつ「今日まだ触っていない」問題数。
         ※#42のSRSは同日連打で s(習得ストリーク)を上げないため、単純な未習得数だと
           今日どれだけ遊んでも残数が減らず「残6コースから進まない」状態になっていた。
           今日消化した分を除くことで、遊べば必ず減る=達成感が出る。空になれば明日へ(SRS通り)。 */
      const td=(typeof todayNum==="function")?todayNum():-1;
      return Q.filter(x=>{ if(x.s!==boss)return false; const st=qstat(x.id);
        return (st.s||0)<2 && st.la!==td; }).length;
    }
    if(mode==="review")return (typeof dueIds==="function")?dueIds().length:0;
    if(mode==="rev")return (typeof wrongIds==="function")?wrongIds().length:0;
    if(mode==="bm")return (typeof bmIds==="function")?bmIds().length:0;
    if(mode==="reco")return (typeof recommend20==="function")?recommend20(999).ids.length:0;
  }catch(e){}
  return 0;
}
/* 残りを「あと◯コース / ◯問」に変換。端数は切り上げ(3分でも達成感が出るように)。 */
function courseUnitsLeft(mode,boss){
  const q=coursePoolLeft(mode,boss),len=courseLen();
  return {q,courses:Math.ceil(q/len)};
}
/* 結果画面で見せるエリア名(世界観に馴染ませる)。 */
function courseAreaName(mode,boss){
  if(mode==="train")return ((typeof SUBJECTS!=="undefined"&&SUBJECTS[boss])?SUBJECTS[boss]:"")+"街道";
  return ({review:"復習(忘却の亡霊)",reco:"おすすめ特訓",rev:"リベンジ",bm:"ブックマーク"})[mode]||"コース";
}
if(typeof window!=="undefined"){
  window.COURSE_PRESETS=COURSE_PRESETS;window.courseLen=courseLen;
  window.isCourseMode=isCourseMode;window.coursePoolLeft=coursePoolLeft;
  window.courseUnitsLeft=courseUnitsLeft;window.courseAreaName=courseAreaName;
}
