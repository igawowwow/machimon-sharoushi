"use strict";
/* ============================================================
   machimon/data/bosses.js — ボス(単元テスト・過去問・模試のゲーム化)
   ★ボスは学習形式そのもの: エリアボス=単元テスト / 中ボス=過去問 / レイド=模試
   need : 挑戦に必要な習熟度(そこまで学ばないと挑めない=実力に見合った出題)
   ke   : 挑戦権のコスト(知識エネルギー) / reward.ke : 撃破報酬
   hp   : 必要な正解数の目安 ×ダメージ設計(core/boss.js)
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{};

  D.bosses=[
  {id:"b0",name:"ブラック企業王",  area:"rouki",  sub:0,kind:"area",q:10,hp:100,need:0.25,ke:20,
   reward:{ke:30,g:1200,mat:3,tama:1},line:"残業代など払わん！ここは俺のルールだ！"},
  {id:"b1",name:"無防備マシーン",  area:"anei",   sub:1,kind:"area",q:10,hp:100,need:0.25,ke:20,
   reward:{ke:30,g:1200,mat:3,tama:1},line:"カバーなど要らぬ。速ければ良いのだ！"},
  {id:"b2",name:"災害ヌシ",        area:"rousai", sub:2,kind:"area",q:10,hp:100,need:0.25,ke:20,
   reward:{ke:30,g:1400,mat:3,tama:1},line:"事故はいつでも起きるぞ。備えはあるか？"},
  {id:"b3",name:"失業の影",        area:"koyo",   sub:3,kind:"area",q:10,hp:100,need:0.25,ke:20,
   reward:{ke:30,g:1400,mat:3,tama:1},line:"次の仕事など見つかるものか…"},
  {id:"b4",name:"取立番人",        area:"choshu", sub:4,kind:"area",q:8, hp:80, need:0.25,ke:20,
   reward:{ke:30,g:1400,mat:3,tama:1},line:"期限は待たん。今すぐ納めよ！"},
  {id:"b5",name:"高額療養の壁",    area:"kenpo",  sub:5,kind:"area",q:10,hp:100,need:0.25,ke:20,
   reward:{ke:30,g:1600,mat:4,tama:1},line:"この請求書、君に払えるかな？"},
  {id:"b6",name:"未納の霧",        area:"kokunen",sub:6,kind:"area",q:10,hp:100,need:0.25,ke:20,
   reward:{ke:30,g:1600,mat:4,tama:1},line:"払わずとも今は困るまい…そうだろう？"},
  {id:"b7",name:"報酬比例の巨塔",  area:"kounen", sub:7,kind:"area",q:10,hp:100,need:0.25,ke:20,
   reward:{ke:30,g:1800,mat:4,tama:1},line:"この塔の高さ、計算できるかね？"},
  {id:"b8",name:"統計の迷宮",      area:"ippan",  sub:8,kind:"area",q:8, hp:80, need:0.25,ke:20,
   reward:{ke:30,g:1800,mat:4,tama:1},line:"数字の海で迷うがよい。"},
  /* 中ボス(過去問形式・全科目横断) */
  {id:"mb0",name:"労働法の番人",   area:"*",sub:-1,kind:"mid",q:20,hp:220,need:0.40,ke:40,
   reward:{ke:60,g:5000,mat:10,tama:2},line:"労働法を修めたと言うなら、示してみせよ。",subs:[0,1,2,3,4]},
  {id:"mb1",name:"社会保険の番人", area:"*",sub:-1,kind:"mid",q:20,hp:220,need:0.40,ke:40,
   reward:{ke:60,g:5000,mat:10,tama:2},line:"社会保険の全体像が見えているか。",subs:[5,6,7,8]},
  /* レイドボス(模試形式・9科目36問) */
  {id:"raid0",name:"本試験の化身", area:"*",sub:-1,kind:"raid",q:36,hp:400,need:0.50,ke:60,
   reward:{ke:120,g:15000,mat:25,tama:5},line:"9つの科目、そのすべてで基準を超えてみせよ。",subs:[0,1,2,3,4,5,6,7,8]}
  ];
  D.bossById=Object.create(null);
  for(var i=0;i<D.bosses.length;i++){ D.bossById[D.bosses[i].id]=D.bosses[i]; }
  /* ダメージ設計: 通常正解=10 / 高難度=15(Critical) / コンボ倍率は core/boss.js */
  D.DMG_BASE=10; D.DMG_CRIT=15; D.DMG_COMBO_CAP=0.5;
})();
