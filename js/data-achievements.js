"use strict";
/* ============================================================
   data-achievements.js — 実績バッジ図鑑。プレイの節目で解放される
   収集要素。check()は毎回ST等から評価(専用セーブ不要)。図鑑のボリューム源。
   ============================================================ */
function casesCleared(){let n=0;for(const k in ST.cases)if(ST.cases[k]&&ST.cases[k].cleared)n++;return n;}
function partyCount(){let n=0;if(ST.party)for(const c of COMPANIONS)if(ST.party[c.id])n++;return n;}
const ACHIEVEMENTS=[
 {id:"a_first",icon:"excal",name:"はじめの一勝",desc:"初めてバトルに勝つ",check:()=>ST.totalC>=1},
 {id:"a_c100",icon:"scroll",name:"百問突破",desc:"累計100問正解",check:()=>ST.totalC>=100},
 {id:"a_c500",icon:"brush",name:"千本ノック",desc:"累計500問正解",check:()=>ST.totalC>=500},
 {id:"a_c2000",icon:"crown2",name:"問題の海を渡る者",desc:"累計2000問正解",check:()=>ST.totalC>=2000},
 {id:"a_master50",icon:"medal",name:"知識の芽",desc:"50問を習得",check:()=>masteredCount()>=50},
 {id:"a_master250",icon:"band",name:"知識の樹",desc:"250問を習得",check:()=>masteredCount()>=250},
 {id:"a_masterall",icon:"trophy",name:"全問習得・完全制覇",desc:"全500問を習得",check:()=>masteredCount()>=Q.length},
 {id:"a_combo10",icon:"fire",name:"連撃の使い手",desc:"10コンボ達成",check:()=>ST.maxCombo>=10},
 {id:"a_combo30",icon:"star",name:"止まらぬ連撃",desc:"30コンボ達成",check:()=>ST.maxCombo>=30},
 {id:"a_sp",icon:"excal",name:"必殺技解放",desc:"必殺技を初発動",check:()=>ST.cnt.sp>=1},
 {id:"a_crit100",icon:"marker",name:"会心の百撃",desc:"クリティカル100回",check:()=>ST.cnt.crit>=100},
 {id:"a_boss1",icon:"oni",name:"帝国に一撃",desc:"科目ボスを初討伐",check:()=>badgeCount()>=1},
 {id:"a_boss9",icon:"king",name:"九社制圧",desc:"全9科目ボスを討伐",check:()=>badgeCount()>=9},
 {id:"a_god",icon:"god",name:"試験の神を超えて",desc:"試験の神を撃破(周回クリア)",check:()=>ST.clears>=1},
 {id:"a_loop3",icon:"crown2",name:"三度の頂",desc:"3周クリア",check:()=>ST.clears>=3},
 {id:"a_true",icon:"mao",name:"厚生労働神 撃破",desc:"真ラスボスを倒す",check:()=>ST.trueWin>=1},
 {id:"a_case1",icon:"scroll",name:"事件解決・第一歩",desc:"事件簿を1つ解決",check:()=>casesCleared()>=1},
 {id:"a_caseall",icon:"trophy",name:"事件簿マスター",desc:"全9章の事件を解決",check:()=>casesCleared()>=9},
 {id:"a_office2",icon:"hammer",name:"看板を掲げる",desc:"事務所を『支店』以上に",check:()=>officeRank()>=2},
 {id:"a_office4",icon:"king",name:"社労士法人 本社",desc:"事務所を最高ランクに",check:()=>officeRank()>=4},
 {id:"a_party1",icon:"medal",name:"最初の仲間",desc:"仲間が1人加わる",check:()=>partyCount()>=1},
 {id:"a_party9",icon:"wiz",name:"最強の事務所",desc:"仲間9人が勢揃い",check:()=>partyCount()>=9},
 {id:"a_mock",icon:"scroll",name:"模試デビュー",desc:"簡易模試をクリア",check:()=>ST.mock&&ST.mock.clears>=1},
 {id:"a_mock36",icon:"trophy",name:"模試・満点",desc:"模試で36問全問正解",check:()=>ST.mock&&ST.mock.best>=36},
 {id:"a_login7",icon:"coin",name:"一週間の継続",desc:"連続ログイン7日",check:()=>ST.days>=7},
 {id:"a_login30",icon:"chest",name:"一ヶ月の習慣",desc:"連続ログイン30日",check:()=>ST.days>=30},
 {id:"a_gacha100",icon:"gachaball",name:"ガチャ百連",desc:"ガチャ累計100回",check:()=>ST.gTotal>=100},
 {id:"a_law",icon:"book" in PX?"book":"scroll",name:"論点図鑑コンプ",desc:"全論点の図解を解放",check:()=>zukanLawPct()>=100},
 {id:"a_reb",icon:"star",name:"転生者",desc:"1回転生する",check:()=>ST.reb>=1},
 {id:"a_survivor",icon:"skull",name:"不屈のサバイバー",desc:"サバイバルで30体討伐",check:()=>ST.survBest>=30}
];
function achDone(){return ACHIEVEMENTS.filter(a=>{try{return a.check();}catch(e){return false;}});}
/* 新たに達成した実績を検知し ST.ach に記録。解放バッジ配列を返す(演出用) */
function achCheckUnlock(){
  if(!ST.ach)ST.ach={};
  const got=[];
  for(const a of achDone()){if(!ST.ach[a.id]){ST.ach[a.id]=1;got.push(a);}}
  return got;
}
function achPct(){return Math.round(achDone().length/ACHIEVEMENTS.length*100);}
