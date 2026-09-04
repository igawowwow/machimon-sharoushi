"use strict";
/* ============================================================
   machimon/data/races.js — 社労士ダービー(ウイニングポスト風)のレース暦・賞金・ライバル
   ★1年=12か月×4週=48週。年は4月に始まる(試験年度と同じ)。
   ★G1=年に8本(三冠=社労士ダービー・社会保険菊花賞・ジャパン社労士カップ)。
     G2=月1本前後。G3=毎週1本(科目が順番に回る)。
   ★レースの中身は問題そのもの。距離=問題数(短距離5問〜長距離12問)。
   ★賞金はマチG。知識エネルギーはここからは出ない(学習からしか出ない原則を守る)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{};

  var ALL=[0,1,2,3,4,5,6,7,8];
  /* m=月(4..12,1..3) w=その月の週(1..4) grade=1:G1 2:G2 subs=出題科目 n=問題数 crown=三冠の何冠目 */
  D.races=[
   {id:"g1_rouki",  m:4, w:2, name:"労基クラシック",           grade:1, subs:[0],          n:10},
   {id:"g1_anei",   m:5, w:1, name:"安全衛生大賞",             grade:1, subs:[1],          n:10},
   {id:"g2_rousai", m:5, w:3, name:"労災マイルカップ",         grade:2, subs:[2],          n:8},
   {id:"g1_derby",  m:6, w:1, name:"社労士ダービー",           grade:1, subs:ALL,          n:12, crown:1},
   {id:"g1_koyo",   m:6, w:4, name:"雇用記念",                 grade:1, subs:[3],          n:10},
   {id:"g2_choshu", m:7, w:2, name:"徴収サマーカップ",         grade:2, subs:[4],          n:8},
   {id:"g2_kenpo",  m:8, w:2, name:"メディカル杯",             grade:2, subs:[5],          n:8},
   {id:"g2_nenkin", m:9, w:2, name:"年金オータムステークス",   grade:2, subs:[6,7],        n:8},
   {id:"g1_kiku",   m:10,w:1, name:"社会保険菊花賞",           grade:1, subs:[5,6,7,8],    n:12, crown:2},
   {id:"g1_aki",    m:10,w:4, name:"労働法 秋の陣",            grade:1, subs:[0,1,2,3,4],  n:10},
   {id:"g2_ippan",  m:11,w:2, name:"白書クイーンカップ",       grade:2, subs:[8],          n:8},
   {id:"g1_jc",     m:11,w:4, name:"ジャパン社労士カップ",     grade:1, subs:ALL,          n:12, crown:3},
   {id:"g2_kokunen",m:12,w:2, name:"基礎年金ステークス",       grade:2, subs:[6],          n:8},
   {id:"g1_grand",  m:12,w:4, name:"年末グランプリ",           grade:1, subs:ALL,          n:12},
   {id:"g2_shinshun",m:1,w:2, name:"新春マイル",               grade:2, subs:ALL,          n:8},
   {id:"g2_feb",    m:2, w:3, name:"フェブラリー健保ステークス",grade:2, subs:[5],          n:8},
   {id:"g2_haru",   m:3, w:3, name:"春の労基ステークス",       grade:2, subs:[0],          n:8}
  ];
  D.raceById=Object.create(null);
  for(var i=0;i<D.races.length;i++){ D.raceById[D.races[i].id]=D.races[i]; }

  /* グレード別: 賞金(1〜5着)・勝利ボーナス・ライバルの基礎力・疲労 */
  D.raceGrade={
   1:{label:"G1", color:"#2F6BFF", prize:[6000,2400,1500,900,600], bonus:{tix:1,tama:1,mat:5}, power:160, fat:3, n:10},
   2:{label:"G2", color:"#D8534F", prize:[3000,1200,750,450,300],  bonus:{tama:1,mat:3},       power:122, fat:2, n:8},
   3:{label:"G3", color:"#3E9B4F", prize:[1500,600,380,220,150],   bonus:{mat:2},              power:90,  fat:2, n:6}
  };
  D.RUNNERS=8;                 /* 出走頭数(自分を含む) */
  D.YEAR_WEEKS=48;
  D.RIVAL_YEAR_GROWTH=3;       /* 年ごとにライバルが強くなる量(上限 +30) */
  D.CROWN_TIX=10;              /* 三冠達成のガチャチケット */

  /* ライバル馬(住民のマチモンたち)。年×週で決まった顔ぶれになる */
  D.rivalNames=[
   "テイジノカゼ","ザンギョウオー","シャロウシノホシ","ハクショドラゴン","キュウフノヒカリ","ネンキンスター",
   "ロウサイブレイブ","ホケンショウカン","メンジョノカゼ","チョウシュウハヤテ","アンゼンダイイチ","ユウキュウフラッシュ",
   "テイシュツキゲン","ヒョウジュンホウシュウ","サンジュウロク","ゴウカクマシン","コウネンサンダー","ミライネンキン",
   "サクセスジョブ","シュウギョウキソク","ホワイトカイシャ","キソネンキンオー","ジュウギョウイン","カイコヨコク"
  ];
  /* 調子(ウイポの◎○△×)。fat=疲労の段階 */
  D.cond=[
   {mark:"◎",name:"絶好調",mod:8,  color:"#D8534F"},
   {mark:"○",name:"好調",  mod:0,  color:"#3E9B4F"},
   {mark:"△",name:"平凡",  mod:-8, color:"#8A8494"},
   {mark:"×",name:"不調",  mod:-20,color:"#5B6FD8"}
  ];
  /* 年度表彰 */
  D.awards=[
   {id:"best",  name:"年度代表マチモン", icon:"👑", tix:3, tama:1},
   {id:"wins",  name:"最多勝利",         icon:"🏅", tix:1},
   {id:"prize", name:"賞金王",           icon:"💰", tix:1}
  ];
})();
