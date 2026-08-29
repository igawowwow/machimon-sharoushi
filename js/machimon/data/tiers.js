"use strict";
/* ============================================================
   machimon/data/tiers.js — 世界階層13段(小さな事務所 → 宇宙)
   ★単純な数字インフレを禁じる。各段で必ず「新しい意思決定」を1つ増やす。
   adds : その階層で解放される新システム(UIはフラグを見て出し分ける)
   ke   : 解放に必要な知識エネルギー(学習からしか得られない)
   mvp  : true=MVPで実装済み / false=データ定義のみ(将来追加でアプリ本体の改修不要)
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{};

  D.tiers=[
  {id:"office", name:"小さな社労士事務所",ke:0,    adds:["incident","hatch","place"],    mvp:true,
   desc:"机がひとつ。ここから始まる"},
  {id:"shotengai",name:"商店街",          ke:120,  adds:["upgrade"],            mvp:true,
   desc:"建物を強化できるようになる"},
  {id:"town",   name:"町",                ke:300,  adds:["place","slots"],      mvp:true,
   desc:"建物を配置し、マチモンを働かせられる"},
  {id:"city",   name:"都市",              ke:500,  adds:["traffic","corp"],     mvp:true,
   desc:"交通がエリアをつなぎ、企業が定期収入を生む"},
  {id:"metro",  name:"巨大都市",          ke:800,  adds:["district","jobs"],    mvp:false,
   desc:"区画とマチモンの職業が生まれる"},
  {id:"region", name:"地方",              ke:1280, adds:["multitown"],          mvp:false,
   desc:"複数の街を行き来する"},
  {id:"nation", name:"国家",              ke:2050, adds:["policy","welfare"],   mvp:false,
   desc:"社会保障と雇用の政策を選ぶ"},
  {id:"contin", name:"大陸",              ke:3280, adds:["climate"],            mvp:false,
   desc:"地域ごとの特性が生まれる"},
  {id:"planet", name:"マチモン惑星",      ke:5250, adds:["multicity"],          mvp:false,
   desc:"複数の都市を並行して育てる"},
  {id:"planets",name:"惑星群",            ke:8400, adds:["logistics"],          mvp:false,
   desc:"惑星間の物流が始まる"},
  {id:"system", name:"星系",              ke:13400,adds:["planettrait"],        mvp:false,
   desc:"惑星ごとに科目特化の性質を持つ"},
  {id:"galaxy", name:"銀河",              ke:21500,adds:["meta"],               mvp:false,
   desc:"これまでの学びが次の周回に受け継がれる"},
  {id:"universe",name:"宇宙",             ke:34400,adds:["multiqual"],          mvp:false,
   desc:"ほかの資格の惑星が、同じ宇宙に加わる"}
  ];
  /* 階層ごとの世界の見た目(街シーン・世界マップ) */
  D.tierLook=[
   {icon:"🏢",h:170,deco:["🌱","🌱"],far:""},
   {icon:"🏪",h:180,deco:["🌳","🏪","🌳","🪧"],far:""},
   {icon:"🏘️",h:190,deco:["🌳","🏘️","⛲","🌳","🚏"],far:""},
   {icon:"🏙️",h:200,deco:["🌳","🚏","⛲","🏬"],far:"🏢🏬🏢🏨🏢",car:true},
   {icon:"🌆",h:210,deco:["🚏","🏬","🗼","⛲"],far:"🏢🏨🏢🗼🏢🏬🏢",car:true,train:true},
   {icon:"🗾",h:220,deco:["⛲","🏬","🚉","🌳"],far:"🗻🏢🏢🌉🏢",car:true,train:true},
   {icon:"🏯",h:230,deco:["🏛️","🚉","⛲","🏬"],far:"🏯🏢🗼🏢🌉",car:true,train:true},
   {icon:"🌍",h:230,deco:["🏛️","🚉","✈️","🏬"],far:"🗻🏙️🌉🏙️🗻",car:true,train:true},
   {icon:"🪐",h:240,deco:["🏛️","🛸","🚀","🏬"],far:"🏙️🛰️🏙️🚀🏙️",space:true},
   {icon:"🌌",h:240,deco:["🛸","🚀","🛰️","🏛️"],far:"🪐🛰️🌍🚀🪐",space:true},
   {icon:"☀️",h:250,deco:["🛸","🚀","🛰️","🪐"],far:"🌍🪐☀️🪐🌍",space:true},
   {icon:"🌠",h:250,deco:["🛸","🌠","🛰️","🪐"],far:"🌌🌠🌌🌠🌌",space:true},
   {icon:"🌌",h:260,deco:["🌠","🛸","🪐","🌠"],far:"🌌🌍🌌🪐🌌",space:true}
  ];
  D.tierById=Object.create(null);
  for(var i=0;i<D.tiers.length;i++){ D.tiers[i].idx=i; D.tierById[D.tiers[i].id]=D.tiers[i]; }
})();
