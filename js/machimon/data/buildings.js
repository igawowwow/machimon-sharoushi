"use strict";
/* ============================================================
   machimon/data/buildings.js — 建物(生産 + 事件発生源)
   prod : 毎時の基礎生産力(Lv倍) / cost : Lv1の建設費(以降 ×2.2^(Lv-1))
   slotType : 配置適性の判定キー(species.fit と突き合わせる)
   fx.incident : その科目の事件発生率ボーナス / fx.coin : マチG増加率
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var D=MM.DATA=MM.DATA||{};

  D.buildings=[
  {id:"home",   name:"住宅",        area:"*",      prod:4, cost:200, slotType:"live",
   fx:{live:2},                 desc:"マチモンの居住枠 +2"},
  {id:"office", name:"相談所",      area:"rouki",  prod:8, cost:400, slotType:"work",
   fx:{incident:0.20},          desc:"労基法の事件が出やすくなる"},
  {id:"factory",name:"工場",        area:"rouki",  prod:12,cost:900, slotType:"work",
   fx:{incident:0.20,coin:0.10},desc:"労基法の事件 +20% / マチG +10%"},
  {id:"site",   name:"建設現場",    area:"anei",   prod:12,cost:900, slotType:"work",
   fx:{incident:0.25},          desc:"安衛法の事件が出やすくなる"},
  {id:"clinic", name:"診療所",      area:"rousai", prod:14,cost:1400,slotType:"care",
   fx:{incident:0.25},          desc:"労災の事件が出やすくなる"},
  {id:"hw",     name:"ハローワーク",area:"koyo",   prod:14,cost:1400,slotType:"desk",
   fx:{incident:0.25},          desc:"雇用の事件が出やすくなる"},
  {id:"tax",    name:"徴収窓口",    area:"choshu", prod:16,cost:1800,slotType:"desk",
   fx:{incident:0.25},          desc:"徴収法の事件が出やすくなる"},
  {id:"hosp",   name:"総合病院",    area:"kenpo",  prod:18,cost:2000,slotType:"care",
   fx:{incident:0.25},          desc:"健保の事件が出やすくなる"},
  {id:"city",   name:"市民課",      area:"kokunen",prod:18,cost:2000,slotType:"desk",
   fx:{incident:0.25},          desc:"国年の事件が出やすくなる"},
  {id:"pens",   name:"年金局",      area:"kounen", prod:22,cost:2600,slotType:"desk",
   fx:{incident:0.25},          desc:"厚年の事件が出やすくなる"},
  {id:"gov",    name:"統計局",      area:"ippan",  prod:22,cost:2600,slotType:"desk",
   fx:{incident:0.25},          desc:"労一社一の事件が出やすくなる"}
  ];
  D.bldById=Object.create(null);
  for(var i=0;i<D.buildings.length;i++){ D.bldById[D.buildings[i].id]=D.buildings[i]; }
  D.COST_GROWTH=2.2;   /* Lvごとのコスト倍率 */
  D.BLD_LV_MAX=5;
})();
